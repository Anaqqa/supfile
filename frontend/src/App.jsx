import { BrowserRouter as Router } from 'react-router-dom'
import './App.css'

function App() {
  return (
    <Router>
      <div className="container-fluid vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="text-center">
          <h1 className="display-4 text-primary mb-4">
            <i className="bi bi-cloud-arrow-up"></i> SUPFile
          </h1>
          <p className="lead text-muted">
            Cloud Storage Platform
          </p>
          <div className="alert alert-success mt-4" role="alert">
            <i className="bi bi-check-circle"></i> Application en cours de développement
          </div>
          <small className="text-muted">Architecture 3-tiers opérationnelle</small>
        </div>
      </div>
    </Router>
  )
}

export default App