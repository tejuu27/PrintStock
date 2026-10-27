
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>PrintStock</h1>
          <p>Anything and Everything in Printing</p>
        </div>
      </header>

      <main className="dashboard-content">
        <h2>Dashboard</h2>
        <p>Welcome! Manage your printing press stock from here.</p>

        <div className="dashboard-cards">
          <div className="dashboard-card">
            <h3>Clients</h3>
            <p>Manage your printing customers.</p>
            <button onClick={() => navigate("/clients")}>
              View Clients
            </button>
          </div>

          <div className="dashboard-card">
            <h3>Producers</h3>
            <p>Manage your paper suppliers.</p>
            <button onClick={() => navigate("/producers")}>
              View Producers
            </button>
          </div>

          <div className="dashboard-card">
            <h3>Stock</h3>
            <p>Track materials and available quantities.</p>
            <button onClick={() => navigate("/stock")}>
              View Stock
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
