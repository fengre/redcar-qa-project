import { QuestionForm } from './components/QuestionForm'
import { AuthProvider, useAuth } from './AuthContext'
import { AuthModal } from './AuthModal'

function AppContent() {
  const { isAuthenticated } = useAuth();
  return (
    <div className="min-h-screen p-8 pb-20 gap-8 font-sans bg-gray-50">
      {!isAuthenticated && <AuthModal />}
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

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App 