import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/legal-page-layout";

export const metadata: Metadata = {
  title: "Privacy | Studynia",
  description: "A simple overview of how the Studynia project handles information.",
};

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      title="Privacy"
      description="The short version of what this project stores and how its features use it."
    >
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">What gets saved</h2>
        <p>
          Studynia stores basic account details, like your email and profile, along with the study content you add: courses, materials, notes, quiz answers and results, chats, and items you share.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Canvas and AI quizzes</h2>
        <p>
          If you connect Canvas, Studynia uses your connection to load course information and materials. When you ask for an AI quiz, the selected material is sent to the quiz service and Google Gemini to make the questions. AI can get things wrong, so double-check the answers. For this project demo, only use material you are comfortable sending to those services.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Sharing</h2>
        <p>
          Notes, results, and messages are visible to other people when you choose to share them or send them in chat. Check who can see a note before sharing it.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Storage and deletion</h2>
        <p>
          Studynia uses Supabase for accounts and app data. Sign-in cookies and browser storage help keep your session and preferences working. Deleted notes stay in Trash for up to 30 days before they are permanently removed.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Questions?</h2>
        <p>
          This is a project mock. For questions about your account or data, contact the person or institution that gave you access to this Studynia deployment.
        </p>
      </section>
    </LegalPageLayout>
  );
}
