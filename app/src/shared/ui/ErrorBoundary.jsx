import { Component } from 'react';
export default class ErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <main role="alert" className="min-h-screen grid place-content-center gap-4 p-8 bg-ws-canvas text-ws-bright">
      <h1 className="text-xl font-semibold">Não foi possível carregar esta página</h1>
      <p>Recarregue para tentar novamente. Se o problema continuar, entre em contato com o suporte.</p>
      <button type="button" className="btn-primary" onClick={() => window.location.reload()}>Recarregar página</button>
    </main>;
    return this.props.children;
  }
}
