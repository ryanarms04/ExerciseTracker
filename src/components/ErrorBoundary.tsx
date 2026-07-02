import { Component, type ReactNode } from 'react'
import { Button } from './ui/Button'
import { Card } from './ui/Card'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/** Router-level boundary: a render crash shows a reset card instead of a white screen. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.error('Unhandled render error:', error)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-dvh bg-bg flex items-center justify-center px-5">
          <Card className="p-6 max-w-sm w-full text-center space-y-4">
            <h1 className="type-heading text-text">Something went wrong</h1>
            <p className="type-body text-text-mute">
              Your data is safe — it lives on this device, not in the app. Try
              again, or reload if this keeps happening.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="secondary" onClick={() => this.setState({ error: null })}>
                Try again
              </Button>
              <Button onClick={() => window.location.reload()}>Reload app</Button>
            </div>
          </Card>
        </div>
      )
    }
    return this.props.children
  }
}
