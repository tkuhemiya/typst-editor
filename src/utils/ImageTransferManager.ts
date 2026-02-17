const CHUNK_SIZE = 256 * 1024; // 256KB chunks

interface WebrtcConn {
  peer: any;
  connected: boolean;
  synced: boolean;
}

export interface ImageMetadata {
  id: string;
  filename: string;
  size: number;
  type: string;
  uploadedBy: string;
  timestamp: number;
}

interface TransferMessage {
  type: "request" | "chunk" | "complete" | "error";
  imageId: string;
  index?: number;
  total?: number;
  dataLength?: number;
  message?: string;
}

interface PendingRequest {
  resolve: (data: Uint8Array) => void;
  reject: (error: Error) => void;
  chunks: Map<number, Uint8Array>;
  totalChunks: number;
  receivedChunks: number;
}

export class ImageTransferManager {
  private peerChannels = new Map<string, RTCDataChannel>();
  private pendingRequests = new Map<string, PendingRequest>();
  private projectName: string;
  private onImageChange: () => void;
  private getImageData: (imageId: string) => Promise<Uint8Array | undefined>;
  private myPeerId: string = "";
  private lastChunkMetadata: TransferMessage | null = null;

  constructor(
    projectName: string,
    onImageChange: () => void,
    getImageData: (imageId: string) => Promise<Uint8Array | undefined>
  ) {
    this.projectName = projectName;
    this.onImageChange = onImageChange;
    this.getImageData = getImageData;
  }

  setMyPeerId(peerId: string) {
    this.myPeerId = peerId;
  }

  setupPeer(webrtcConn: WebrtcConn, peerId: string) {
    try {
      const simplePeer = webrtcConn.peer as any;
      const pc = simplePeer._pc as RTCPeerConnection;

      if (!pc) {
        console.warn("No peer connection available for", peerId);
        return;
      }

      // Check if channel already exists
      if (this.peerChannels.has(peerId)) {
        console.log("Image channel already exists for peer", peerId);
        return;
      }

      // Create dedicated data channel for images
      const imageChannel = pc.createDataChannel("images", {
        ordered: true,
      });

      imageChannel.binaryType = "arraybuffer";

      imageChannel.onopen = () => {
        console.log("Image data channel opened with peer", peerId);
      };

      imageChannel.onclose = () => {
        console.log("Image data channel closed with peer", peerId);
        this.peerChannels.delete(peerId);
      };

      imageChannel.onerror = (error) => {
        console.error("Image data channel error with peer", peerId, error);
      };

      imageChannel.onmessage = (event) => {
        this.handleMessage(peerId, event.data);
      };

      this.peerChannels.set(peerId, imageChannel);

      // Also listen for incoming data channels from remote peer
      pc.ondatachannel = (event) => {
        if (event.channel.label === "images") {
          const remoteChannel = event.channel;
          remoteChannel.binaryType = "arraybuffer";

          remoteChannel.onopen = () => {
            console.log("Received image data channel from peer", peerId);
          };

          remoteChannel.onmessage = (msgEvent) => {
            this.handleMessage(peerId, msgEvent.data);
          };

          this.peerChannels.set(peerId, remoteChannel);
        }
      };
    } catch (error) {
      console.error("Failed to setup peer", peerId, error);
    }
  }

  async requestImage(imageId: string, fromPeerId: string): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      const channel = this.peerChannels.get(fromPeerId);

      if (!channel || channel.readyState !== "open") {
        console.warn(
          "No open channel to peer",
          fromPeerId,
          "trying any available peer"
        );

        // Try any available peer
        for (const [peerId, ch] of this.peerChannels.entries()) {
          if (ch.readyState === "open") {
            return this.requestImageFromChannel(imageId, peerId, ch).then(
              resolve,
              reject
            );
          }
        }

        return reject(
          new Error(`No open channels available to request image ${imageId}`)
        );
      }

      this.requestImageFromChannel(imageId, fromPeerId, channel).then(
        resolve,
        reject
      );
    });
  }

  private requestImageFromChannel(
    imageId: string,
    peerId: string,
    channel: RTCDataChannel
  ): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      // Setup pending request
      this.pendingRequests.set(imageId, {
        resolve,
        reject,
        chunks: new Map(),
        totalChunks: 0,
        receivedChunks: 0,
      });

      // Send request
      const request: TransferMessage = {
        type: "request",
        imageId,
      };

      try {
        channel.send(JSON.stringify(request));
        console.log("Requested image", imageId, "from peer", peerId);

        // Timeout after 30 seconds
        setTimeout(() => {
          if (this.pendingRequests.has(imageId)) {
            this.pendingRequests.delete(imageId);
            reject(new Error(`Image transfer timeout for ${imageId}`));
          }
        }, 30000);
      } catch (error) {
        this.pendingRequests.delete(imageId);
        reject(error);
      }
    });
  }

  private async handleMessage(peerId: string, data: ArrayBuffer | string) {
    try {
      // Check if it's a string message (JSON) or binary data
      if (typeof data === "string" || data instanceof ArrayBuffer) {
        const text =
          typeof data === "string" ? data : new TextDecoder().decode(data);

        // Try to parse as JSON
        try {
          const message: TransferMessage = JSON.parse(text);

          switch (message.type) {
            case "request":
              await this.handleRequest(peerId, message.imageId);
              break;

            case "chunk":
              // Store chunk metadata, next message will be binary data
              this.lastChunkMetadata = message;
              break;

            case "complete":
              this.handleComplete(message.imageId);
              break;

            case "error":
              this.handleError(
                message.imageId,
                message.message || "Unknown error"
              );
              break;
          }
        } catch (parseError) {
          // Not JSON, might be binary chunk data
          if (this.lastChunkMetadata && data instanceof ArrayBuffer) {
            this.handleBinaryChunk(new Uint8Array(data));
          }
        }
      }
    } catch (error) {
      console.error("Failed to handle message from peer", peerId, error);
    }
  }

  private handleBinaryChunk(data: Uint8Array) {
    if (!this.lastChunkMetadata) return;

    const { imageId, index, total } = this.lastChunkMetadata;
    const pending = this.pendingRequests.get(imageId!);

    if (!pending) {
      console.warn("Received chunk for non-pending request:", imageId);
      this.lastChunkMetadata = null;
      return;
    }

    if (pending.totalChunks === 0) {
      pending.totalChunks = total!;
    }

    // Store chunk
    pending.chunks.set(index!, data);
    pending.receivedChunks++;

    console.log(
      `Received chunk ${index! + 1}/${total} for image ${imageId} (${data.length} bytes)`
    );

    this.lastChunkMetadata = null;
  }

  private async handleRequest(peerId: string, imageId: string) {
    console.log("Peer", peerId, "requested image", imageId);

    try {
      // Get image data from IndexedDB
      const imageData = await this.getImageData(imageId);

      if (!imageData) {
        console.error("Image not found in IndexedDB:", imageId);
        this.sendError(peerId, imageId, "Image not found");
        return;
      }

      // Send image in chunks
      await this.sendImageChunks(peerId, imageId, imageData);
    } catch (error) {
      console.error("Failed to handle image request", error);
      this.sendError(peerId, imageId, String(error));
    }
  }

  private async sendImageChunks(
    peerId: string,
    imageId: string,
    data: Uint8Array
  ) {
    const channel = this.peerChannels.get(peerId);
    if (!channel || channel.readyState !== "open") {
      console.error("Channel not available for peer", peerId);
      return;
    }

    const totalChunks = Math.ceil(data.length / CHUNK_SIZE);
    console.log(
      `Sending image ${imageId} in ${totalChunks} chunks to peer ${peerId}`
    );

    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, data.length);
      const chunkData = data.slice(start, end);

      // Create message with chunk metadata
      const message: TransferMessage = {
        type: "chunk",
        imageId,
        index: i,
        total: totalChunks,
        dataLength: chunkData.length,
      };

      // Send metadata first
      channel.send(JSON.stringify(message));

      // Send binary data immediately after
      channel.send(chunkData.buffer);

      // Add small delay to avoid overwhelming the channel
      if (i < totalChunks - 1) {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    }

    // Send completion message
    const completeMsg: TransferMessage = {
      type: "complete",
      imageId,
    };
    channel.send(JSON.stringify(completeMsg));

    console.log(`Finished sending image ${imageId} to peer ${peerId}`);
  }

  private handleComplete(imageId: string) {
    const pending = this.pendingRequests.get(imageId);

    if (!pending) {
      console.warn("Received complete for non-pending request:", imageId);
      return;
    }

    // Reassemble chunks
    const chunks = Array.from(pending.chunks.entries()).sort(
      ([a], [b]) => a - b
    );
    const totalLength = chunks.reduce(
      (sum, [, chunk]) => sum + chunk.length,
      0
    );
    const result = new Uint8Array(totalLength);

    let offset = 0;
    for (const [, chunk] of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    console.log(`Image ${imageId} transfer complete, ${result.length} bytes`);

    pending.resolve(result);
    this.pendingRequests.delete(imageId);
  }

  private handleError(imageId: string, message: string) {
    const pending = this.pendingRequests.get(imageId);

    if (pending) {
      pending.reject(new Error(message));
      this.pendingRequests.delete(imageId);
    }
  }

  private sendError(peerId: string, imageId: string, message: string) {
    const channel = this.peerChannels.get(peerId);
    if (!channel || channel.readyState !== "open") return;

    const errorMsg: TransferMessage = {
      type: "error",
      imageId,
      message,
    };

    channel.send(JSON.stringify(errorMsg));
  }

  cleanup() {
    // Close all channels
    for (const channel of this.peerChannels.values()) {
      if (channel.readyState === "open") {
        channel.close();
      }
    }

    this.peerChannels.clear();

    // Reject all pending requests
    for (const [imageId, pending] of this.pendingRequests.entries()) {
      pending.reject(new Error("Transfer manager cleanup"));
    }

    this.pendingRequests.clear();
  }
}
