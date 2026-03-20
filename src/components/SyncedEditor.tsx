import type React from "react"

type SyncedEditorProps = {
    roomId: string
    setContent: React.Dispatch<React.SetStateAction<string>>
    setUserCount: React.Dispatch<React.SetStateAction<number>>
}

function SyncedEditor({ roomId, setContent, setUserCount}: SyncedEditorProps) {
    return(null)
}

export default SyncedEditor
