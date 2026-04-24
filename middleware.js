import { NextResponse } from "next/server"

export function middleware(request) {
  const { pathname } = request.nextUrl

  // On app.axisapp.nl, rewrite root "/" to "/home"
  if (pathname === "/") {
    const host = request.headers.get("host") || ""
    if (host.startsWith("app.")) {
      return NextResponse.rewrite(new URL("/home", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/"],
}
