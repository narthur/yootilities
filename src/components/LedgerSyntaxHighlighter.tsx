import React from "react";

interface Props {
  content: string;
}

function LedgerSyntaxHighlighter({ content }: Props) {
  const highlightLine = (line: string) => {
    if (line.trim().startsWith("iou[")) {
      // Highlight iou entries
      const match = line.match(/(iou\[)(.*?)(,\s*)(.*?)(\s*,\s*)(.*?)(\s*,\s*)(.*?)(\s*,\s*")(.*?)("\])/);
      if (match) {
        const [, iou, date, comma1, amount, comma2, from, comma3, to, comma4, comment, end] = match;
        return (
          <span>
            <span style={{ color: "#4B5563" }}>{iou}</span>
            <span style={{ color: "#059669" }}>{date}</span>
            {comma1}
            <span style={{ color: "#0891B2" }}>{amount}</span>
            {comma2}
            <span style={{ color: "#7C3AED" }}>{from}</span>
            {comma3}
            <span style={{ color: "#7C3AED" }}>{to}</span>
            {comma4}
            <span style={{ color: "#6B7280" }}>{comment}</span>
            <span style={{ color: "#4B5563" }}>{end}</span>
          </span>
        );
      }
    } else if (line.trim().startsWith("account[")) {
      // Highlight account definitions
      const match = line.match(/(account\[)(.*?)(,\s*")(.*?)(")(.*)\]/);
      if (match) {
        const [, account, id, comma, name, quote, rest] = match;
        return (
          <span>
            <span style={{ color: "#4B5563" }}>{account}</span>
            <span style={{ color: "#7C3AED" }}>{id}</span>
            {comma}
            <span style={{ color: "#6B7280" }}>{name}</span>
            {quote}
            {rest}
          </span>
        );
      }
    } else if (line.trim().startsWith("(*")) {
      // Highlight comments
      return <span style={{ color: "#9CA3AF" }}>{line}</span>;
    }
    return line;
  };

  return (
    <pre style={{ margin: 0, display: "inline" }}>
      {content.split("\n").map((line, i) => (
        <React.Fragment key={i}>
          {highlightLine(line)}
          {i < content.split("\n").length - 1 && "\n"}
        </React.Fragment>
      ))}
    </pre>
  );
}

export default LedgerSyntaxHighlighter;
