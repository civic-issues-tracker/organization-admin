import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../../../components/ui/Modal';
import LoginForm from '../components/LoginForm';

const LoginPage:React.FC = () => {
  const [isModalOpen] = useState(true); 
  const navigate = useNavigate();

  const handleClose = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen w-full bg-[radial-gradient(circle_at_top_left,_rgba(144,107,51,0.08),_transparent_30%),linear-gradient(180deg,_#fdfbf7_0%,_#f7f7f7_100%)] flex items-center justify-center relative overflow-hidden px-4 py-10">
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.06] pointer-events-none select-none overflow-hidden">
        <h1 className="text-[25vw] font-black uppercase tracking-tighter leading-none whitespace-nowrap">
            የኛ Fix
        </h1>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={handleClose}
        title="Welcome back to Civic Tracker"
      >
        <LoginForm />
      </Modal>
    </div>
  );
};

export default LoginPage;