import { redirect } from "next/navigation"

export default function FavoritesPage() {
  redirect("/notes?filter=favorites")
}
