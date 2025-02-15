import { useEffect, useRef } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import 'xterm/css/xterm.css';

interface TerminalProps {
  className?: string;
}

export function Terminal({ className }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize xterm.js
    const term = new XTerm({
      theme: {
        background: '#1a1b26',
        foreground: '#a9b1d6',
        cursor: '#c0caf5',
        selection: '#33467c',
        black: '#414868',
        red: '#f7768e',
        green: '#9ece6a',
        yellow: '#e0af68',
        blue: '#7aa2f7',
        magenta: '#bb9af7',
        cyan: '#7dcfff',
        white: '#c0caf5',
      },
      fontFamily: 'JetBrains Mono, Menlo, Monaco, Consolas, monospace',
      fontSize: 14,
      lineHeight: 1.2,
      cursorBlink: true,
      cursorStyle: 'block',
    });

    // Add addons
    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    
    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);

    // Open terminal
    term.open(terminalRef.current);
    fitAddon.fit();

    // Store reference
    xtermRef.current = term;

    // Write welcome message
    term.writeln('\x1b[1;34m╭──────────────────────────────────────╮\x1b[0m');
    term.writeln('\x1b[1;34m│\x1b[0m  Welcome to AI Development Platform  \x1b[1;34m│\x1b[0m');
    term.writeln('\x1b[1;34m╰──────────────────────────────────────╯\x1b[0m');
    term.writeln('');
    term.write('\x1b[1;32m➜\x1b[0m ');

    // Handle input
    term.onData((data) => {
      // Echo input
      term.write(data);

      // Handle enter key
      if (data === '\r') {
        term.writeln('');
        term.write('\x1b[1;32m➜\x1b[0m ');
      }
    });

    // Handle resize
    const handleResize = () => fitAddon.fit();
    window.addEventListener('resize', handleResize);

    return () => {
      term.dispose();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <div ref={terminalRef} className={className} />;
}