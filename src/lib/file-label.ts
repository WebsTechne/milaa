function getFileLabel(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "file"

  const extMap: Record<string, string> = {
    pdf: "PDF",
    doc: "DOC",
    docx: "DOCX",
    txt: "TXT",
    zip: "ZIP",
    rar: "RAR",
    html: "HTML",
    css: "CSS",
    js: "JS",
    ts: "TS",
    java: "JAVA",
    py: "PY",
    c: "C",
    cpp: "CPP",
    cs: "CS",
    ipynb: "IPYNB",
  }

  return extMap[ext] ?? ext.toUpperCase()
}

export { getFileLabel }
