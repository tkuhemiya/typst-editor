import { useReducer } from "react";
import TypstView from "./components/TypstView";
import LocalEditor from "./components/LocalEditor";

export function App() {
  const [buffer, setBuffer] = useReducer(
    (_: string, nextValue: string) => nextValue,
    ""
  );

  return (
    <div className="m-0 flex h-screen flex-1">
      <LocalEditor buffer={buffer} setBuffer={setBuffer} />
      <TypstView buffer={buffer} />
    </div>
  );
}

export default App;
