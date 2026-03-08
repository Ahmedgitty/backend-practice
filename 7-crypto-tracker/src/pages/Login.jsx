import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Matrix rain canvas effect
function MatrixCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const cols = Math.floor(canvas.width / 16);
    const drops = Array(cols).fill(1);
    const chars = "アイウエオカキクケコ01アBCDEF∑∆Ω₿ΞETHBTC$%#@!01";
    const draw = () => {
      ctx.fillStyle = "rgba(5,13,5,0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#00ff41";
      ctx.font = "13px Space Mono, monospace";
      drops.forEach((y, i) => {
        const char = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(char, i * 16, y * 16);
        if (y * 16 > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      });
    };
    const interval = setInterval(draw, 50);
    return () => clearInterval(interval);
  }, []);
  return <canvas ref={canvasRef} className="matrix-canvas" />;
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8081/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || "Login failed");
      login(data.user, data.token);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <MatrixCanvas />
      <div className="auth-box">
        <div className="auth-header">
          <div className="auth-logo">⬡ CRYPTEX</div>
          <h2>ACCESS TERMINAL</h2>
          <p className="auth-subtitle">Enter credentials to proceed</p>
        </div>
        {error && <p className="auth-error">{error}</p>}
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Email Address</label>
            <input className="auth-input" type="email" placeholder="operator@domain.com"
              value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="input-group">
            <label className="input-label">Password</label>
            <input className="auth-input" type="password" placeholder="••••••••••••"
              value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? "AUTHENTICATING..." : "▶ ENTER SYSTEM"}
          </button>
        </form>
        <p className="auth-footer">
          No account? <Link to="/signup">Register access</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
