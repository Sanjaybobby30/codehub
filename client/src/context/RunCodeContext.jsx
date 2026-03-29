import { createContext, useEffect, useRef, useState } from "react"
import PropTypes from "prop-types"
import useFileSystem from "@/hooks/useFileSystem"
import { judge0 } from "@/api/"
import toast from "react-hot-toast"
import { getTemplate } from "@/utils/defaultTemplates"
import JUDGE0_LANGUAGES, { getLangByExtension } from "@/utils/judge0Languages"
import { v4 as uuidv4 } from "uuid"
import ACTIONS from "@/utils/actions"
import useSocket from "@/hooks/useSocket"

const RunCodeContext = createContext()

// Judge0 status ids
const STATUS = {
    IN_QUEUE:   1,
    PROCESSING: 2,
    ACCEPTED:   3,
    // 4-13 are various errors/signals
}

const RunCodeContextProvider = ({ children }) => {
    const { currentFile, setCurrentFile, setFiles, files } = useFileSystem()
    const { socket } = useSocket()
    const [input, setInput]       = useState("")
    const [output, setOutput]     = useState(null)   // null | { stdout, stderr, compile_output, message, status }
    const [isRunning, setIsRunning] = useState(false)
    const [selectedLanguage, setSelectedLanguage] = useState(null)

    const manualLangChange = useRef(false)

    // Auto-detect language from file extension whenever the open file changes
    useEffect(() => {
        if (!currentFile) return
        if (manualLangChange.current) {
            manualLangChange.current = false
            return
        }
        const ext = currentFile.name.split(".").pop()
        const lang = getLangByExtension(ext)
        setSelectedLanguage(lang || null)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentFile?.name])

    // Called when user manually picks a language from the dropdown
    const changeLanguageAndCreateFile = (lang) => {
        manualLangChange.current = true
        setSelectedLanguage(lang)
        setOutput(null)

        const { filename, code } = getTemplate(lang.id, lang.name)
        const existing = files.find((f) => f.name === filename)
        if (existing) {
            setCurrentFile(existing)
            return
        }

        const newFile = { id: uuidv4(), name: filename, content: code }
        setFiles((prev) => [...prev, newFile])
        setCurrentFile(newFile)
        socket.emit(ACTIONS.FILE_CREATED, { file: newFile })
        toast.success(`Created ${filename}`)
    }

    /**
     * Submit code to Judge0, poll for result, set output.
     * Judge0 CE community instance: https://ce.judge0.com
     * Flow: POST /submissions?wait=true  (synchronous mode — simplest)
     */
    const runCode = async () => {
        if (!selectedLanguage) {
            return toast.error("Please select a language to run the code")
        }
        if (!currentFile) {
            return toast.error("No file is open to run")
        }

        setOutput(null)
        setIsRunning(true)
        const toastId = toast.loading("Running code...")

        try {
            // Encode source code + stdin as base64 (Judge0 requires it)
            const sourceB64 = btoa(unescape(encodeURIComponent(currentFile.content)))
            const stdinB64  = input ? btoa(unescape(encodeURIComponent(input))) : undefined

            // Submit with wait=true for a synchronous single-call result
            const response = await judge0.post(
                "/submissions?base64_encoded=true&wait=true&fields=stdout,stderr,compile_output,message,status,time,memory",
                {
                    language_id:    selectedLanguage.id,
                    source_code:    sourceB64,
                    ...(stdinB64 && { stdin: stdinB64 }),
                },
            )

            const data = response.data

            // Decode base64 fields back to plain text
            const decode = (b64) => {
                if (!b64) return ""
                try {
                    return decodeURIComponent(escape(atob(b64)))
                } catch {
                    return b64
                }
            }

            const stdout         = decode(data.stdout)
            const stderr         = decode(data.stderr)
            const compile_output = decode(data.compile_output)
            const message        = decode(data.message)
            const statusDesc     = data.status?.description ?? ""

            setOutput({ stdout, stderr, compile_output, message, statusDesc })
            toast.dismiss(toastId)

            if (data.status?.id === STATUS.ACCEPTED) {
                toast.success("Code ran successfully")
            } else {
                toast.error(`${statusDesc}`)
            }
        } catch (error) {
            console.error(error)
            const errMsg =
                error?.response?.data?.error ||
                error?.response?.data?.message ||
                error?.message ||
                "Unknown error"
            setOutput({ stdout: "", stderr: "", compile_output: "", message: `Error: ${errMsg}`, statusDesc: "Request Failed" })
            toast.dismiss(toastId)
            toast.error("Failed to run the code")
        } finally {
            setIsRunning(false)
        }
    }

    return (
        <RunCodeContext.Provider
            value={{
                setInput,
                output,
                isRunning,
                supportedLanguages: JUDGE0_LANGUAGES,
                selectedLanguage,
                setSelectedLanguage: changeLanguageAndCreateFile,
                runCode,
            }}
        >
            {children}
        </RunCodeContext.Provider>
    )
}

RunCodeContextProvider.propTypes = {
    children: PropTypes.node.isRequired,
}

export { RunCodeContextProvider }
export default RunCodeContext
