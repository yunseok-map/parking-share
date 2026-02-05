'use client';

interface ShareButtonProps {
  parkingId: string;
  parkingName: string;
  parkingAddress: string;
  className?: string;
}

export default function ShareButton({ 
  parkingId, 
  parkingName, 
  parkingAddress,
  className = '' 
}: ShareButtonProps) {

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/detail/${parkingId}`;
    const shareText = `🅿️ ${parkingName}\n📍 ${parkingAddress}\n\n무료 주차장 정보를 공유합니다!`;

    // Web Share API 지원 확인 (모바일)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `주차장: ${parkingName}`,
          text: shareText,
          url: shareUrl,
        });
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('공유 실패:', error);
          fallbackCopyToClipboard(shareUrl, shareText);
        }
      }
    } else {
      // PC에서는 클립보드 복사
      fallbackCopyToClipboard(shareUrl, shareText);
    }
  };

  const fallbackCopyToClipboard = (url: string, text: string) => {
    const fullText = `${text}\n\n🔗 ${url}`;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(fullText)
        .then(() => {
          alert('✅ 링크가 복사되었습니다!\n카카오톡이나 문자로 공유해보세요 😊');
        })
        .catch(() => {
          manualCopy(fullText);
        });
    } else {
      manualCopy(fullText);
    }
  };

  const manualCopy = (text: string) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
      document.execCommand('copy');
      alert('✅ 링크가 복사되었습니다!\n카카오톡이나 문자로 공유해보세요 😊');
    } catch (err) {
      alert('❌ 복사 실패\n직접 주소를 복사해주세요:\n' + text);
    }
    
    document.body.removeChild(textarea);
  };

  return (
    <button
      onClick={handleShare}
      className={`
        flex items-center justify-center gap-2
        px-4 py-2 rounded-lg
        bg-blue-500 text-white
        hover:bg-blue-600 active:bg-blue-700
        transition-colors
        font-medium
        ${className}
      `}
    >
      <span className="text-xl">📤</span>
      <span>공유하기</span>
    </button>
  );
}
