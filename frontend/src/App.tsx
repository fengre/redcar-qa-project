import { QuestionForm } from './components/QuestionForm'

function App() {
  return (
    <div className="min-h-screen p-8 pb-20 gap-8 font-sans bg-gray-50">
      <main className="max-w-2xl mx-auto flex flex-col gap-8">
        <h1 className="text-3xl font-bold text-center text-gray-900">
          Company Question Analyzer
        </h1>
        <div className="bg-white p-6 rounded-lg shadow">
          <QuestionForm />
        </div>
      </main>
    </div>
  )
}

export default App 