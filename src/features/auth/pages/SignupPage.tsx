import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../../../components/ui/Modal';
import SignupForm from '../components/SignupForm';

const SignupPage: React.FC = () => {
  const [isModalOpen] = useState(true);
  const navigate = useNavigate();

  const handleClose = () => {
    // setIsModalOpen(false);
    navigate('/'); 
  };

  return (
    <div className="min-h-screen w-full bg-[radial-gradient(circle_at_top_left,_rgba(144,107,51,0.08),_transparent_30%),linear-gradient(180deg,_#fdfbf7_0%,_#f7f7f7_100%)] flex items-center justify-center px-4 py-10">
      <div className="opacity-[0.06] pointer-events-none select-none">
        <h1 className="text-[20vw] font-black uppercase tracking-tighter">የኛ Fix</h1>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={handleClose}
        title="Start your account"
      >
        <SignupForm />
      </Modal>
    </div>
  );
};

export default SignupPage;