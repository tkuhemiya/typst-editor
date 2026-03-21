import { useState } from "react";
import TypstView from "./components/TypstView";
import LocalEditor from "./components/LocalEditor";

export function App() {
  const [buffer, setBuffer] = useState("");

  return (
    <div className="flex flex-1 h-screen m-0">
      <LocalEditor buffer={buffer} setBuffer={setBuffer} />
      <TypstView buffer={buffer} />
    </div>
  );
}

export default App;
