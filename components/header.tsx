import { MicroscopeIcon } from "lucide-react"

export function Header() {
  return (
    <header className="flex items-center justify-between py-6">
      <div className="flex items-center gap-2">
        <MicroscopeIcon className="h-8 w-8 text-emerald-600" />
        <h1 className="text-2xl font-bold">Your New Name Here</h1>
      </div>
      <div className="text-sm text-muted-foreground">Your New Organization Name</div>
    </header>
  )
}
