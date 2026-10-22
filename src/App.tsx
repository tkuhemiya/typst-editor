import { useState } from "react";
import TypstView from "./components/TypstView";
import LocalEditor from "./components/LocalEditor";

export function App() {
  const [buffer, setBuffer] = useState("");

  return (
    <div className="m-0 flex h-screen flex-1">
      <LocalEditor buffer={buffer} setBuffer={setBuffer} />
      <TypstView buffer={buffer} />
    </div>
  );
}

export default App;
