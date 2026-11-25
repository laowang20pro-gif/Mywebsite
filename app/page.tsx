'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [balance, setBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  
  const supabase = createClient()

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data } = await supabase
          .from('credit_accounts')
          .select('balance')
          .eq('user_id', user.id)
          .single()
        
        if (data) setBalance(data.balance)
      }
      setLoading(false)
    }
    
    checkUser()
  }, [])

  const handleLogin = async () => {
    const email = prompt("请输入你的邮箱进行测试登录：")
    if (email) {
      await supabase.auth.signInWithOtp({ email })
      alert("登录链接已发送到邮箱，请查收！")
    }
  }

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>正在连接 Supabase...</div>

  return (
    <div style={{ padding: '50px', fontFamily: 'sans-serif', textAlign: 'center' }}>
      <h1>🎬 AI 短剧创作平台</h1>
      
      {user ? (
        <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', display: 'inline-block' }}>
          <p>当前登录：<strong>{user.email}</strong></p>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#0070f3' }}>
            积分余额：{balance !== null ? balance : '读取中...'}
          </p>
        </div>
      ) : (
        <div style={{ marginTop: '20px' }}>
          <p>请先登录你的账号</p>
          <button 
            onClick={handleLogin}
            style={{ padding: '10px 20px', backgroundColor: '#000', color: '#fff', borderRadius: '5px', cursor: 'pointer' }}
          >
            点击登录 (邮箱魔法链接)
          </button>
        </div>
      )}
    </div>
  )
}
