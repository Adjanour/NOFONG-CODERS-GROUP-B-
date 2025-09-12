import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import OTPInput from '../../components/ui/Input/OTPInput';
import { Button } from '../../components/ui/Button/Button';
import { useAuth } from '../../context/AuthContext';

type LocationState = { phone: string; purpose: 'login'|'register' } | undefined;

const OtpPage: React.FC = () => {
  const location = useLocation();
  const state = (location.state as LocationState) || { phone: '', purpose: 'login' };
  const navigate = useNavigate();
  const { sendOtp, verifyOtp, loading, error: authError, clearError } = useAuth();
  const [error, setError] = React.useState('');
  const [countdown, setCountdown] = React.useState(30);
  const [attempts, setAttempts] = React.useState(0);

  React.useEffect(() => {
    // kick off a countdown for resend
    setCountdown(30);
    const t = setInterval(() => setCountdown((c)=>c>0?c-1:0), 1000);
    return () => clearInterval(t);
  }, [state?.phone, state?.purpose]);

  const onComplete = async (code: string) => {
    setError('');
    clearError();
    
    const result = await verifyOtp(code);
    
    switch (result) {
      case 'invalid':
        setAttempts(prev => prev + 1);
        setError(authError || 'Incorrect code. Please try again.');
        break;
      case 'expired':
        setError('Code has expired. Please request a new one.');
        break;
      case 'rate_limited':
        setError('Too many attempts. Please request a new code.');
        break;
      case 'profile_pending':
        navigate('/profile/create');
        break;
      case 'logged_in':
        navigate('/');
        break;
    }
  };

  const resend = async () => {
    if (countdown > 0 || loading) return;
    
    setError('');
    clearError();
    setAttempts(0);
    
    const result = await sendOtp(state.phone, state.purpose);
    if (result.success) {
      setCountdown(30);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{backgroundColor: 'var(--color-white)'}}>
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-6 mb-8">
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{backgroundColor:'var(--color-light-green)'}}>
            <span style={{color:'var(--color-brand)'}}>🔐</span>
          </div>
          <h1 className="text-2xl font-semibold" style={{fontFamily:'var(--font-family-heading)', color:'var(--color-text-strong)'}}>Enter verification code</h1>
          <p className="text-sm text-gray-600">We sent a code to {state.phone || 'your phone'}</p>
        </div>

        <OTPInput length={6} onComplete={onComplete} disabled={loading} />
        {(error || authError) && (
          <div className="mt-2 p-3 rounded-lg" style={{backgroundColor:'#fef2f2', border:'1px solid #fecaca'}}>
            <p className="text-sm" style={{color:'#dc2626'}}>
              {error || authError}
            </p>
            {(error?.includes('expired') || error?.includes('Too many')) && (
              <button 
                onClick={resend}
                className="mt-2 text-sm underline"
                style={{color:'var(--color-brand)'}}
                disabled={countdown > 0 || loading}
              >
                {countdown > 0 ? `Resend in ${countdown}s` : 'Get new code'}
              </button>
            )}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <Button variant="ghost" onClick={()=>navigate(-1)} disabled={loading}>Back</Button>
          <Button 
            onClick={resend} 
            disabled={countdown > 0 || loading}
          >
            {loading ? 'Sending...' : countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}
          </Button>
        </div>
        
        {attempts > 0 && (
          <p className="mt-4 text-center text-sm" style={{color:'var(--color-medium-gray)'}}>
            Having trouble? Make sure you entered the 6-digit code sent to {state.phone}
          </p>
        )}
      </div>
    </div>
  );
};

export default OtpPage;


