import { useState } from "react";
import TypstView from "./components/TypstView";
import SyncedEditor from "./components/SyncedEditor";
import LocalEditor from "./components/LocalEditor";
import useUrl from "./hooks/use-url";

export function App() {
  const [buffer, setBuffer] = useState<string>("");
  const [urlParams] = useUrl();
  const [userCount, setUserCount] = useState<number>(0);

  const roomId = urlParams.get("room");

  return (
    <div className="flex flex-1 h-screen m-0">
      {!!roomId ? (
        <SyncedEditor
          roomId={roomId}
          setContent={setBuffer}
          setUserCount={setUserCount}
        />
      ) : (
        <LocalEditor buffer={buffer} setBuffer={setBuffer} />
      )}
      <TypstView buffer={buffer} />
    </div>
  );
}

export default App;
