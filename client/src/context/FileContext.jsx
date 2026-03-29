import useAppContext from "@/hooks/useAppContext"
import useSetting from "@/hooks/useSetting"
import useSocket from "@/hooks/useSocket"
import ACTIONS from "@/utils/actions"
import initialFile from "@/utils/initialFile"
import { saveAs } from "file-saver"
import JSZip from "jszip"
import langMap from "lang-map"
import PropTypes from "prop-types"
import { createContext, useCallback, useEffect, useState } from "react"
import { toast } from "react-hot-toast"
import { v4 as uuidv4 } from "uuid"

const FileContext = createContext()

function FileContextProvider({ children }) {
    const { socket } = useSocket()
    const { setLanguage } = useSetting()
    const [files, setFiles] = useState([initialFile])
    const [currentFile, setCurrentFile] = useState(initialFile)
    const { setUsers } = useAppContext()

    const createFile = (name) => {
        let num = 1
        let fileExists = files.some((file) => file.name === name)

        while (fileExists) {
            name = `${name} (${num++})`
            fileExists = files.some((file) => file.name === name)
            if (!fileExists) break
        }

        const id = uuidv4()
        const file = { id, name, content: "" }
        setFiles((prev) => [...prev, file])
        socket.emit(ACTIONS.FILE_CREATED, { file })
        return id
    }

    const updateFile = (id, content) => {
        setFiles((prev) =>
            prev.map((file) => {
                if (file.id === id) {
                    file.content = content
                }
                return file
            }),
        )
    }

    const openFile = (id) => {
        if (currentFile) {
            updateFile(currentFile.id, currentFile.content)
        }
        const file = files.find((file) => file.id === id)
        setCurrentFile(file)
    }

    const renameFile = (id, newName) => {
        setFiles((prev) =>
            prev.map((file) => {
                if (file.id === id) {
                    file.name = newName
                }
                return file
            }),
        )
        if (currentFile.id === id) {
            setCurrentFile((prev) => ({ ...prev, name: newName }))
        }
        socket.emit(ACTIONS.FILE_RENAMED, {
            file: files.find((f) => f.id === id),
        })
    }

    const deleteFile = (id) => {
        setFiles((prev) => prev.filter((file) => file.id !== id))
        if (currentFile.id === id) {
            setCurrentFile(null)
        }
        socket.emit(ACTIONS.FILE_DELETED, { id })
    }

    const downloadCurrentFile = () => {
        const blob = new Blob([currentFile.content], {
            type: "text/plain;charset=utf-8",
        })
        saveAs(blob, currentFile.name)
    }

    const downloadAllFiles = () => {
        const zip = new JSZip()
        files.forEach((file) => {
            zip.file(file.name, file.content)
        })
        zip.generateAsync({ type: "blob" }).then(function (content) {
            saveAs(content, "Code-Sync-Files.zip")
        })
    }

    const handleUserJoined = useCallback(
        ({ user }) => {
            toast.success(`${user.username} joined the room`)
            socket.emit(ACTIONS.SYNC_FILES, {
                files,
                currentFile,
                socketId: user.socketId,
            })
            setUsers((pre) => [...pre, user])
        },
        [currentFile, files, setUsers, socket],
    )

    const handleFileSync = useCallback(({ files, currentFile }) => {
        setFiles(files)
        setCurrentFile(currentFile)
    }, [])

    const handleFileRenamed = useCallback(({ file }) => {
        setFiles((prev) =>
            prev.map((f) => {
                if (f.id === file.id) {
                    f.name = file.name
                }
                return f
            }),
        )
    }, [])

    const handleFileDeleted = useCallback(
        ({ id }) => {
            setFiles((prev) => prev.filter((file) => file.id !== id))
            if (currentFile && currentFile.id === id) {
                setCurrentFile(null)
            }
        },
        [currentFile],
    )

    const handleFileCreated = useCallback(({ file }) => {
        setFiles((prev) => [...prev, file])
    }, [])

    const handleFileUpdated = useCallback(
        ({ file }) => {
            setFiles((prev) =>
                prev.map((f) => {
                    if (f.id === file.id) {
                        f.content = file.content
                    }
                    return f
                }),
            )
            if (currentFile && currentFile.id === file.id) {
                setCurrentFile(file)
            }
        },
        [currentFile],
    )

    // FIX: Safely set editor language from file extension.
    // - Only runs when the file NAME changes (not on every content update)
    // - Guards against langMap returning undefined/empty
    // - Normalises to CapitaliseFirst to match SettingContext expectation
    useEffect(() => {
        if (!currentFile) return

        const ext = currentFile.name.split(".").pop()
        const names = langMap.languages(ext)
        if (!names || names.length === 0) return

        // langMap returns e.g. "JavaScript" — normalise to "Javascript"
        const raw = names[0]
        const normalised =
            raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase()
        setLanguage(normalised)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentFile?.name])          // ← only re-run when filename changes, NOT on content edits

    useEffect(() => {
        socket.once(ACTIONS.SYNC_FILES, handleFileSync)
        socket.on(ACTIONS.USER_JOINED, handleUserJoined)
        socket.on(ACTIONS.FILE_CREATED, handleFileCreated)
        socket.on(ACTIONS.FILE_UPDATED, handleFileUpdated)
        socket.on(ACTIONS.FILE_RENAMED, handleFileRenamed)
        socket.on(ACTIONS.FILE_DELETED, handleFileDeleted)

        return () => {
            socket.off(ACTIONS.USER_JOINED)
            socket.off(ACTIONS.FILE_CREATED)
            socket.off(ACTIONS.FILE_UPDATED)
            socket.off(ACTIONS.FILE_RENAMED)
            socket.off(ACTIONS.FILE_DELETED)
        }
    }, [
        handleFileCreated,
        handleFileDeleted,
        handleFileRenamed,
        handleFileSync,
        handleFileUpdated,
        handleUserJoined,
        socket,
    ])

    return (
        <FileContext.Provider
            value={{
                files,
                setFiles,
                currentFile,
                setCurrentFile,
                createFile,
                updateFile,
                openFile,
                renameFile,
                deleteFile,
                downloadCurrentFile,
                downloadAllFiles,
            }}
        >
            {children}
        </FileContext.Provider>
    )
}

FileContextProvider.propTypes = {
    children: PropTypes.node.isRequired,
}

export { FileContextProvider }
export default FileContext
