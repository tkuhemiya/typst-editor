import Editor, { type OnMount } from "@monaco-editor/react";
import {
  useEffect,
  useRef,
  type ClipboardEvent,
  type Dispatch,
} from "react";
import { getBuffer, storeBuffer, storeImage } from "@/store";

interface LocalEditorProps {
  buffer: string;
  setBuffer: Dispatch<string>;
}

const LocalEditor = ({ buffer, setBuffer }: LocalEditorProps) => {
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const stored = await getBuffer();
      if (stored) {
        setBuffer(stored);
      }
    };

    void loadData();
  }, [setBuffer]);

  const onMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  const handlePaste = async (e: ClipboardEvent<HTMLDivElement>) => {
    if (e.clipboardData.files.length === 0) return;
    const imageFile = e.clipboardData.files[0];

    if (imageFile?.type.startsWith("image/")) {
      e.preventDefault();
      const data = new Uint8Array(await imageFile.arrayBuffer());
      const filename = imageFile.name.normalize();

      console.log("pasted");
      storeImage(filename, data);

      const editor = editorRef.current;
      if (!editor) return;

      const selection = editor.getSelection();
      if (!selection) return;

      editor.executeEdits("paste-image", [
        {
          range: selection,
          text: `#image("${filename}")`,
          forceMoveMarkers: true,
        },
      ]);
    }
  };

  const handleChange = (value: string | undefined | null) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      const nextValue = value ?? "";
      setBuffer(nextValue);
      console.log("Saving to DB:", nextValue);
      await storeBuffer(nextValue);
    }, 200);
  };

  return (
    <div className="h-full w-1/2" onPasteCapture={handlePaste}>
      <Editor
        height="100%"
        theme="vs-dark"
        defaultLanguage="markdown"
        value={buffer}
        onChange={handleChange}
        onMount={onMount}
        options={{
          minimap: { enabled: false },
          automaticLayout: true,
          wordWrap: "on",
        }}
      />
    </div>
  );
};

export default LocalEditor;
