
export default function Home() {
  return (
    <main className="page">
      <div className="card">
        <div className="logo">AI</div>

        <h1>短剧 AI 工作台</h1>

        <p className="subtitle">
          让 AI 帮你创造精彩短剧
        </p>

        <button>
          开始创作
        </button>

        <div className="status">
          <span></span>
          网站运行正常
        </div>
      </div>

      <style jsx>{`
        .page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f5f6fa;
          padding: 20px;
          font-family: Arial, sans-serif;
        }

        .card {
          width: 100%;
          max-width: 420px;
          background: white;
          padding: 45px 25px;
          border-radius: 20px;
          text-align: center;
          box-shadow: 0 10px 40px rgba(0,0,0,0.06);
        }

        .logo {
          width: 65px;
          height: 65px;
          line-height: 65px;
          margin: 0 auto 25px;
          border-radius: 18px;
          background: #d73301;
          color: white;
          font-size: 25px;
          font-weight: bold;
        }

        h1 {
          font-size: 26px;
          color: #222;
          margin-bottom: 12px;
        }

        .subtitle {
          color: #888;
          font-size: 14px;
          margin-bottom: 35px;
        }

        button {
          width: 100%;
          height: 48px;
          background: #d73301;
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 16px;
        }

        .status {
          margin-top: 30px;
          color: #888;
          font-size: 12px;
        }

        .status span {
          display: inline-block;
          width: 8px;
          height: 8px;
          background: #22c55e;
          border-radius: 50%;
          margin-right: 7px;
        }
      `}</style>
    </main>
  );
}


