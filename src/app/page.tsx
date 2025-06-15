'use client';
import { QuestionForm } from '../views/components/question-form';

export default function Home() {
  return (
    <div className="min-h-screen p-8 pb-20 gap-8 font-[family-name:var(--font-geist-sans)]">
      <main className="max-w-2xl mx-auto flex flex-col gap-8">
        <h1 className="text-3xl font-bold text-center">
          Company Question Analyzer
        </h1>
        <QuestionForm />
      </main>
    </div>
  );
}