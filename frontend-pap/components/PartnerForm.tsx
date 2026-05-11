import React, { useState } from 'react';

interface PartnerFormProps {
  onSubmit: (data: { name: string; email: string; company: string }) => void;
}

const PartnerForm: React.FC<PartnerFormProps> = ({ onSubmit }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, email, company });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col">
        <label htmlFor="partner-name" className="mb-1 font-medium">Nome</label>
        <input
          id="partner-name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          className="border rounded px-2 py-1 w-full"
          required
          placeholder="Digite seu nome"
        />
      </div>
      <div className="flex flex-col">
        <label htmlFor="partner-email" className="mb-1 font-medium">Email</label>
        <input
          id="partner-email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="border rounded px-2 py-1 w-full"
          required
          placeholder="Digite seu email"
        />
      </div>
      <div className="flex flex-col">
        <label htmlFor="partner-company" className="mb-1 font-medium">Empresa</label>
        <input
          id="partner-company"
          type="text"
          value={company}
          onChange={e => setCompany(e.target.value)}
          className="border rounded px-2 py-1 w-full"
          required
          placeholder="Nome da empresa"
        />
      </div>
      <button
        type="submit"
        className="bg-green-600 text-white rounded px-4 py-2 hover:bg-green-700"
      >
        Enviar
      </button>
    </form>
  );
};

export default PartnerForm;
