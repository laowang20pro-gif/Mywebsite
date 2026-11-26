'use client';
import { usePathname } from 'next/navigation';

const INFO = {
  assets: ['素材库', '管理人物、场景、道具、服装，分全局素材和项目素材，支持 AI 生成和版本记录。'],
  generate: ['视频生成', '选择模型和参数，单个或批量生成分镜视频，生成前显示预计积分。'],
  tasks: ['任务中心', '查看生成任务的排队、进度、失败原因，支持暂停、取消和重试。'],
  videos: ['视频与成片', '管理每个分镜的视频版本，剪辑拼接并导出成片。'],
  account: ['个人中心', '积分余额、充值、消费明细和账号安全。'],
  settings: ['设置', '全局默认模型和生成参数。'],
};

export default function Placeholder() {
  const slug = usePathname().split('/')[1];
  const info = INFO[slug];
  if (!info) return <div className="empty">页面不存在</div>;
  return (
    <>
      <h1>{info[0]}</h1>
      <div className="card" style={{ marginTop: 16 }}>
        <p style={{ margin: 0 }}>{info[1]}</p>
        <p className="mute" style={{ marginBottom: 0 }}>这个功能正在开发中，后续阶段上线。</p>
      </div>
    </>
  );
}
