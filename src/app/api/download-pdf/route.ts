import { NextResponse } from "next/server";

export async function GET() {
  const dummyPdfContent = "%PDF-1.4 ... Executive Performance Report";
  
  return new NextResponse(dummyPdfContent, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="Executive_Performance_Report.pdf"',
      "Cache-Control": "no-store, max-age=0"
    }
  });
}
