import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CodeEditor.css';

const CodeEditor = () => {
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState(`// Try this JavaScript code:
console.log("Hello World!");

// Or try a function:
function greet(name) {
  return "Hello " + name + "!";
}

console.log(greet("Code Vimarsh"));

// Try calculations:
console.log("Sum:", 10 + 20);
console.log("Product:", 5 * 6);`);
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pyodide, setPyodide] = useState(null);
  const [pyodideLoading, setPyodideLoading] = useState(true);
  const [stdin, setStdin] = useState('');

  // Load Pyodide for Python execution
  useEffect(() => {
    if (window.loadPyodide) {
      window.loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/'
      }).then((py) => {
        setPyodide(py);
        setPyodideLoading(false);
      }).catch((error) => {
        console.error('Error loading Pyodide:', error);
        setPyodideLoading(false);
      });
    } else {
      setPyodideLoading(false);
    }
  }, []);

  const executeJavaScript = (codeString) => {
    // Code execution is disabled in production for security reasons
    setOutput("Code execution is disabled in production for security reasons.");
    return 'Code execution is disabled in production for security reasons.';
  };

  const executePython = async (codeString) => {
    if (!pyodide) {
      return 'Python runtime is loading... Please wait a moment and try again.';
    }

    try {
      // Capture print statements
      let output = '';
      pyodide.runPython(`
import sys
from io import StringIO
sys.stdout = StringIO()
      `);

      try {
        pyodide.runPython(codeString);
        output = pyodide.runPython('sys.stdout.getvalue()');
      } catch (error) {
        output = `Error: ${error.message}`;
      }

      return output || 'Code executed successfully! (No output)';
    } catch (error) {
      return `Error: ${error.message}`;
    }
  };

  const executeCppOrC = async (codeString, lang, input = '') => {
    try {
      // Use backend API (which uses free CodeX/Piston APIs)
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const response = await axios.post(`${API_URL}/code/execute`, {
        code: codeString,
        language: lang,
        stdin: input
      });
      
      if (response.data.error) {
        return `Error: ${response.data.error}`;
      }
      return response.data.output || 'Code executed successfully! (No output)';
    } catch (error) {
      if (error.response?.data?.error) {
        return `Error: ${error.response.data.error}`;
      }
      return `Error: ${error.message}\n\nNote: Please make sure the backend server is running on port 5000.`;
    }
  };

  const handleRun = async () => {
    setLoading(true);
    setOutput('');

    try {
      let result = '';

      // Always use backend API if stdin is provided (works for ALL languages)
      // For JS/Python without stdin, try browser execution first (faster)
      // For all other languages, always use backend API
      const hasStdin = stdin.trim().length > 0;
      const useBackend = hasStdin || (language !== 'javascript' && language !== 'python');

      if (useBackend) {
        // Use backend API (supports stdin and all languages)
        result = await executeCppOrC(code, language, stdin);
        setOutput(result);
      } else if (language === 'javascript') {
        // JavaScript without stdin: try browser execution first
        try {
          result = executeJavaScript(code);
          setOutput(result);
        } catch (error) {
          // Fallback to backend API
          result = await executeCppOrC(code, language, stdin);
          setOutput(result);
        }
      } else if (language === 'python') {
        // Python without stdin: try Pyodide first if loaded
        if (pyodideLoading) {
          // If Pyodide not loaded, use backend API
          result = await executeCppOrC(code, language, stdin);
          setOutput(result);
        } else {
          try {
            result = await executePython(code);
            setOutput(result);
          } catch (error) {
            // Fallback to backend API
            result = await executeCppOrC(code, language, stdin);
            setOutput(result);
          }
        }
      }
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    const defaultCodes = {
      javascript: `// Try this JavaScript code:
console.log("Hello World!");

// Or try a function:
function greet(name) {
  return "Hello " + name + "!";
}

console.log(greet("Code Vimarsh"));

// Try calculations:
console.log("Sum:", 10 + 20);
console.log("Product:", 5 * 6);`,
      python: `# Try this Python code:
print("Hello World!")

# Or try a function:
def greet(name):
    return f"Hello {name}!"

print(greet("Code Vimarsh"))

# Try calculations:
print("Sum:", 10 + 20)
print("Product:", 5 * 6)`,
      cpp: `// Try this C++ code:
#include <iostream>
#include <string>
using namespace std;

string greet(string name) {
    return "Hello " + name + "!";
}

int main() {
    cout << "Hello World!" << endl;
    
    // Or try a function:
    cout << greet("Code Vimarsh") << endl;
    
    // Try calculations:
    cout << "Sum: " << (10 + 20) << endl;
    cout << "Product: " << (5 * 6) << endl;
    return 0;
}`,
      c: `// Try this C code:
#include <stdio.h>

void greet(char* name) {
    printf("Hello %s!\\n", name);
}

int main() {
    printf("Hello World!\\n");
    
    // Or try a function:
    greet("Code Vimarsh");
    
    // Try calculations:
    printf("Sum: %d\\n", 10 + 20);
    printf("Product: %d\\n", 5 * 6);
    return 0;
}`,
      java: `// Try this Java code:
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello World!");
        
        // Or try a function:
        System.out.println(greet("Code Vimarsh"));
        
        // Try calculations:
        System.out.println("Sum: " + (10 + 20));
        System.out.println("Product: " + (5 * 6));
    }
    
    static String greet(String name) {
        return "Hello " + name + "!";
    }
}`,
      php: `<?php
// Try this PHP code:
echo "Hello World!\\n";

// Or try a function:
function greet($name) {
    return "Hello " . $name . "!";
}

echo greet("Code Vimarsh") . "\\n";

// Try calculations:
echo "Sum: " . (10 + 20) . "\\n";
echo "Product: " . (5 * 6) . "\\n";
?>`,
      ruby: `# Try this Ruby code:
puts "Hello World!"

# Or try a function:
def greet(name)
    return "Hello " + name + "!"
end

puts greet("Code Vimarsh")

# Try calculations:
puts "Sum: #{10 + 20}"
puts "Product: #{5 * 6}"`,
      go: `package main

import "fmt"

func main() {
    fmt.Println("Hello World!")
    
    // Or try a function:
    fmt.Println(greet("Code Vimarsh"))
    
    // Try calculations:
    fmt.Println("Sum:", 10 + 20)
    fmt.Println("Product:", 5 * 6)
}

func greet(name string) string {
    return "Hello " + name + "!"
}`,
      rust: `// Try this Rust code:
fn main() {
    println!("Hello World!");
    
    // Or try a function:
    println!("{}", greet("Code Vimarsh"));
    
    // Try calculations:
    println!("Sum: {}", 10 + 20);
    println!("Product: {}", 5 * 6);
}

fn greet(name: &str) -> String {
    format!("Hello {}!", name)
}`,
      swift: `// Try this Swift code:
print("Hello World!")

// Or try a function:
func greet(name: String) -> String {
    return "Hello " + name + "!"
}

print(greet("Code Vimarsh"))

// Try calculations:
print("Sum: \\(10 + 20)")
print("Product: \\(5 * 6)")`,
      kotlin: `// Try this Kotlin code:
fun main() {
    println("Hello World!")
    
    // Or try a function:
    println(greet("Code Vimarsh"))
    
    // Try calculations:
    println("Sum: ${10 + 20}")
    println("Product: ${5 * 6}")
}

fun greet(name: String): String {
    return "Hello $name!"
}`,
      typescript: `// Try this TypeScript code:
console.log("Hello World!");

// Or try a function:
function greet(name: string): string {
    return "Hello " + name + "!";
}

console.log(greet("Code Vimarsh"));

// Try calculations:
console.log("Sum:", 10 + 20);
console.log("Product:", 5 * 6);`,
      csharp: `// Try this C# code:
using System;

class Program {
    static void Main() {
        Console.WriteLine("Hello World!");
        
        // Or try a function:
        Console.WriteLine(greet("Code Vimarsh"));
        
        // Try calculations:
        Console.WriteLine("Sum: " + (10 + 20));
        Console.WriteLine("Product: " + (5 * 6));
    }
    
    static string greet(string name) {
        return "Hello " + name + "!";
    }
}`
    };

    setCode(defaultCodes[language] || defaultCodes.javascript);
    setOutput('');
    setStdin(''); // Clear stdin on reset
  };

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    setOutput('');

    const defaultCodes = {
      javascript: `// Try this JavaScript code:
console.log("Hello World!");

// Or try a function:
function greet(name) {
  return "Hello " + name + "!";
}

console.log(greet("Code Vimarsh"));

// Try calculations:
console.log("Sum:", 10 + 20);
console.log("Product:", 5 * 6);`,
      python: `# Try this Python code:
print("Hello World!")

# Or try a function:
def greet(name):
    return f"Hello {name}!"

print(greet("Code Vimarsh"))

# Try calculations:
print("Sum:", 10 + 20)
print("Product:", 5 * 6)`,
      cpp: `// Try this C++ code:
#include <iostream>
#include <string>
using namespace std;

string greet(string name) {
    return "Hello " + name + "!";
}

int main() {
    cout << "Hello World!" << endl;
    
    // Or try a function:
    cout << greet("Code Vimarsh") << endl;
    
    // Try calculations:
    cout << "Sum: " << (10 + 20) << endl;
    cout << "Product: " << (5 * 6) << endl;
    return 0;
}`,
      c: `// Try this C code:
#include <stdio.h>

void greet(char* name) {
    printf("Hello %s!\\n", name);
}

int main() {
    printf("Hello World!\\n");
    
    // Or try a function:
    greet("Code Vimarsh");
    
    // Try calculations:
    printf("Sum: %d\\n", 10 + 20);
    printf("Product: %d\\n", 5 * 6);
    return 0;
}`,
      java: `// Try this Java code:
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello World!");
        
        // Or try a function:
        System.out.println(greet("Code Vimarsh"));
        
        // Try calculations:
        System.out.println("Sum: " + (10 + 20));
        System.out.println("Product: " + (5 * 6));
    }
    
    static String greet(String name) {
        return "Hello " + name + "!";
    }
}`,
      php: `<?php
// Try this PHP code:
echo "Hello World!\\n";

// Or try a function:
function greet($name) {
    return "Hello " . $name . "!";
}

echo greet("Code Vimarsh") . "\\n";

// Try calculations:
echo "Sum: " . (10 + 20) . "\\n";
echo "Product: " . (5 * 6) . "\\n";
?>`,
      ruby: `# Try this Ruby code:
puts "Hello World!"

# Or try a function:
def greet(name)
    return "Hello " + name + "!"
end

puts greet("Code Vimarsh")

# Try calculations:
puts "Sum: #{10 + 20}"
puts "Product: #{5 * 6}"`,
      go: `package main

import "fmt"

func main() {
    fmt.Println("Hello World!")
    
    // Or try a function:
    fmt.Println(greet("Code Vimarsh"))
    
    // Try calculations:
    fmt.Println("Sum:", 10 + 20)
    fmt.Println("Product:", 5 * 6)
}

func greet(name string) string {
    return "Hello " + name + "!"
}`,
      rust: `// Try this Rust code:
fn main() {
    println!("Hello World!");
    
    // Or try a function:
    println!("{}", greet("Code Vimarsh"));
    
    // Try calculations:
    println!("Sum: {}", 10 + 20);
    println!("Product: {}", 5 * 6);
}

fn greet(name: &str) -> String {
    format!("Hello {}!", name)
}`,
      swift: `// Try this Swift code:
print("Hello World!")

// Or try a function:
func greet(name: String) -> String {
    return "Hello " + name + "!"
}

print(greet("Code Vimarsh"))

// Try calculations:
print("Sum: \\(10 + 20)")
print("Product: \\(5 * 6)")`,
      kotlin: `// Try this Kotlin code:
fun main() {
    println("Hello World!")
    
    // Or try a function:
    println(greet("Code Vimarsh"))
    
    // Try calculations:
    println("Sum: ${10 + 20}")
    println("Product: ${5 * 6}")
}

fun greet(name: String): String {
    return "Hello $name!"
}`,
      typescript: `// Try this TypeScript code:
console.log("Hello World!");

// Or try a function:
function greet(name: string): string {
    return "Hello " + name + "!";
}

console.log(greet("Code Vimarsh"));

// Try calculations:
console.log("Sum:", 10 + 20);
console.log("Product:", 5 * 6);`,
      csharp: `// Try this C# code:
using System;

class Program {
    static void Main() {
        Console.WriteLine("Hello World!");
        
        // Or try a function:
        Console.WriteLine(greet("Code Vimarsh"));
        
        // Try calculations:
        Console.WriteLine("Sum: " + (10 + 20));
        Console.WriteLine("Product: " + (5 * 6));
    }
    
    static string greet(string name) {
        return "Hello " + name + "!";
    }
}`
    };

    setCode(defaultCodes[newLang] || defaultCodes.javascript);
    setStdin(''); // Clear stdin when changing language
  };

  return (
    <div className="code-editor-container">
      <div className="code-editor-header">
        <h2>Live Code Editor</h2>
        <div className="code-editor-controls">
          <select 
            value={language} 
            onChange={handleLanguageChange}
            className="language-select"
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="cpp">C++</option>
            <option value="c">C</option>
            <option value="java">Java</option>
            <option value="php">PHP</option>
            <option value="ruby">Ruby</option>
            <option value="go">Go</option>
            <option value="rust">Rust</option>
            <option value="swift">Swift</option>
            <option value="kotlin">Kotlin</option>
            <option value="typescript">TypeScript</option>
            <option value="csharp">C#</option>
          </select>
          <button onClick={handleReset} className="btn-reset">Reset</button>
        </div>
      </div>
      {pyodideLoading && language === 'python' && (
        <div className="loading-indicator">
          Loading Python runtime... This may take a few seconds.
        </div>
      )}
      <textarea
        className="code-editor-textarea"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Write your code here..."
        spellCheck={false}
      />
      <div className="stdin-section">
        <label className="stdin-label">
          <span>Input (stdin):</span>
          <small>Enter input values here for ALL languages (scanf, input(), cin, Scanner, etc.). Separate multiple values with spaces or newlines.</small>
        </label>
        <textarea
          className="stdin-input"
          value={stdin}
          onChange={(e) => setStdin(e.target.value)}
          placeholder="Enter input values here...&#10;Example: 10 20&#10;Or:&#10;10&#10;20"
          rows="3"
        />
      </div>
      <button 
        onClick={handleRun} 
        className="btn-run"
        disabled={loading || (language === 'python' && pyodideLoading && !stdin.trim())}
      >
        {loading ? 'Running...' : 'Run Code ▶'}
      </button>
      {output && (
        <div className="code-output">
          <h3>Output:</h3>
          <pre>{output}</pre>
        </div>
      )}
    </div>
  );
};

export default CodeEditor;
