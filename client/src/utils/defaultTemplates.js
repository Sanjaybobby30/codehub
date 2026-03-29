/**
 * Default boilerplate templates keyed by Judge0 language id.
 * Each entry: { filename, code }
 */
const defaultTemplates = {
    // JavaScript (Node.js 12.14.0) — id 63
    63: { filename: "index.js",   code: `function sayHello() {\n    console.log("Hello, World!");\n}\n\nsayHello();\n` },
    // Python 3.8.1 — id 71
    71: { filename: "main.py",    code: `def main():\n    print("Hello, World!")\n\nif __name__ == "__main__":\n    main()\n` },
    // Python 2.7.17 — id 70
    70: { filename: "main.py",    code: `def main():\n    print "Hello, World!"\n\nif __name__ == "__main__":\n    main()\n` },
    // TypeScript 3.7.4 — id 74
    74: { filename: "index.ts",   code: `function main(): void {\n    console.log("Hello, World!");\n}\n\nmain();\n` },
    // Java OpenJDK 13 — id 62
    62: { filename: "Main.java",  code: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}\n` },
    // C GCC 9.2.0 — id 50
    50: { filename: "main.c",     code: `#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}\n` },
    // C++ GCC 9.2.0 — id 54
    54: { filename: "main.cpp",   code: `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}\n` },
    // C# Mono — id 51
    51: { filename: "Main.cs",    code: `using System;\n\nclass Program {\n    static void Main(string[] args) {\n        Console.WriteLine("Hello, World!");\n    }\n}\n` },
    // Go 1.13.5 — id 60
    60: { filename: "main.go",    code: `package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, World!")\n}\n` },
    // Rust 1.40.0 — id 73
    73: { filename: "main.rs",    code: `fn main() {\n    println!("Hello, World!");\n}\n` },
    // Ruby 2.7.0 — id 72
    72: { filename: "main.rb",    code: `def main\n    puts "Hello, World!"\nend\n\nmain\n` },
    // PHP 7.4.1 — id 68
    68: { filename: "index.php",  code: `<?php\n\nfunction main() {\n    echo "Hello, World!\\n";\n}\n\nmain();\n` },
    // Bash 5.0.0 — id 46
    46: { filename: "main.sh",    code: `#!/bin/bash\n\necho "Hello, World!"\n` },
    // Kotlin 1.3.70 — id 78
    78: { filename: "Main.kt",    code: `fun main() {\n    println("Hello, World!")\n}\n` },
    // Swift 5.2.3 — id 83
    83: { filename: "main.swift", code: `import Foundation\n\nprint("Hello, World!")\n` },
    // Scala 2.13.2 — id 81
    81: { filename: "Main.scala", code: `object Main extends App {\n    println("Hello, World!")\n}\n` },
    // Haskell GHC 8.8.1 — id 61
    61: { filename: "Main.hs",    code: `main :: IO ()\nmain = putStrLn "Hello, World!"\n` },
    // Lua 5.3.5 — id 64
    64: { filename: "main.lua",   code: `local function main()\n    print("Hello, World!")\nend\n\nmain()\n` },
    // R 4.0.0 — id 80
    80: { filename: "main.r",     code: `main <- function() {\n    cat("Hello, World!\\n")\n}\n\nmain()\n` },
    // Perl 5.28.1 — id 85
    85: { filename: "main.pl",    code: `use strict;\nuse warnings;\n\nprint "Hello, World!\\n";\n` },
    // SQL SQLite — id 82
    82: { filename: "query.sql",  code: `SELECT 'Hello, World!' AS message;\n` },
}

/**
 * Get the boilerplate template for a Judge0 language id.
 * Falls back to a generic placeholder.
 */
export function getTemplate(languageId, languageName = "") {
    return (
        defaultTemplates[languageId] || {
            filename: `main.${languageName.toLowerCase().split(" ")[0] || "txt"}`,
            code: `// ${languageName} — start coding here\n`,
        }
    )
}

export default defaultTemplates
