import { SITE_URL } from "../../lib/config";

export const metadata = {
  title: "Blog — stayd. | Tips voor personal trainers",
  description: "Praktische tips voor personal trainers over accountability, client opvolging en consistentie tussen sessies.",
  alternates: {
    canonical: `${SITE_URL}/blog`,
  },
}

export default function BlogLayout({ children }) {
  return <>{children}</>
}
