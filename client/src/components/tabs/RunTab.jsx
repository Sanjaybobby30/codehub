import { useRunCode } from "@/hooks/useRunCode"
import useWindowDimensions from "@/hooks/useWindowDimensions"
import { CaretDown, Copy, Play, Terminal } from "@phosphor-icons/react"
import toast from "react-hot-toast"

function RunTab() {
    const { tabHeight } = useWindowDimensions()
    const {
        setInput,
        output,
        isRunning,
        supportedLanguages,
        selectedLanguage,
        setSelectedLanguage,
        runCode,
    } = useRunCode()

    const handleLanguageChange = (e) => {
        const id = parseInt(e.target.value, 10)
        const lang = supportedLanguages.find((l) => l.id === id)
        if (lang) setSelectedLanguage(lang)
    }

    // Derived display flags
    const hasRun     = output !== null
    const stdout     = output?.stdout         || ""
    const stderr     = output?.stderr         || ""
    const compile    = output?.compile_output || ""
    const message    = output?.message        || ""
    const statusDesc = output?.statusDesc     || ""
    const hasOutput  = stdout || stderr || compile || message
    const isError    = hasRun && !stdout && (stderr || compile || message)

    const copyOutput = () => {
        const text = [stdout, stderr, compile, message].filter(Boolean).join("\n")
        navigator.clipboard.writeText(text)
        toast.success("Output copied to clipboard")
    }

    return (
        <div
            className="flex flex-col items-center gap-2 p-4"
            style={{ height: tabHeight }}
        >
            <h1 className="tab-title">Run Code</h1>
            <div className="flex h-[90%] w-full flex-col items-end gap-2 md:h-[92%]">

                {/* Language Selector */}
                <div className="relative w-full">
                    <select
                        className="w-full rounded-md border-none bg-darkHover px-4 py-2 text-white outline-none"
                        value={selectedLanguage?.id ?? ""}
                        onChange={handleLanguageChange}
                    >
                        <option value="" disabled>Select language...</option>
                        {[...supportedLanguages]
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map((lang) => (
                                <option key={lang.id} value={lang.id}>
                                    {lang.name}
                                </option>
                            ))}
                    </select>
                    <CaretDown size={14} className="absolute bottom-3 right-4 z-10 text-white" />
                </div>

                {/* Stdin */}
                <textarea
                    className="min-h-[80px] w-full resize-none rounded-md border-none bg-darkHover p-2 text-white outline-none"
                    placeholder="Write your input here (stdin)..."
                    onChange={(e) => setInput(e.target.value)}
                />

                {/* Run Button */}
                <button
                    className="flex w-full items-center justify-center gap-2 rounded-md bg-primary p-2 font-bold text-black outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={runCode}
                    disabled={isRunning}
                >
                    <Play size={16} weight="fill" />
                    {isRunning ? "Running..." : "Run"}
                </button>

                {/* Output Header */}
                <div className="flex w-full items-center justify-between">
                    <span className="flex items-center gap-1 text-sm text-gray-400">
                        <Terminal size={15} />
                        Output
                        {hasRun && statusDesc && (
                            <span className={`ml-1 rounded px-1 text-xs text-white ${
                                isError ? "bg-red-700" : "bg-green-700"
                            }`}>
                                {statusDesc}
                            </span>
                        )}
                        {hasRun && !hasOutput && (
                            <span className="ml-1 rounded bg-gray-600 px-1 text-xs text-white">empty</span>
                        )}
                    </span>
                    {hasRun && hasOutput && (
                        <button onClick={copyOutput} title="Copy Output">
                            <Copy size={18} className="cursor-pointer text-gray-400 hover:text-white" />
                        </button>
                    )}
                </div>

                {/* Terminal Panel */}
                <div className="w-full flex-grow overflow-y-auto rounded-md bg-[#0d0d0d] p-3 font-mono text-sm">
                    {!hasRun && (
                        <span className="text-gray-600">Run your code to see output here...</span>
                    )}

                    {hasRun && !hasOutput && (
                        <span className="text-gray-500">(no output)</span>
                    )}

                    {/* Standard output — green */}
                    {stdout && (
                        <pre className="whitespace-pre-wrap text-green-400">{stdout}</pre>
                    )}

                    {/* Compile errors — yellow */}
                    {compile && (
                        <>
                            {stdout && <div className="my-1 border-t border-yellow-800 pt-1 text-xs text-yellow-600">── compile output ──</div>}
                            <pre className="whitespace-pre-wrap text-yellow-300">{compile}</pre>
                        </>
                    )}

                    {/* Runtime stderr — red */}
                    {stderr && (
                        <>
                            {(stdout || compile) && <div className="my-1 border-t border-red-900 pt-1 text-xs text-red-500">── stderr ──</div>}
                            <pre className="whitespace-pre-wrap text-red-400">{stderr}</pre>
                        </>
                    )}

                    {/* Judge0 status message (TLE, OOM, etc.) */}
                    {message && !stderr && !compile && (
                        <pre className="whitespace-pre-wrap text-orange-400">{message}</pre>
                    )}
                </div>
            </div>
        </div>
    )
}

export default RunTab
