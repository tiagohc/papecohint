export async function getMe() {
    const token = localStorage.getItem("token");
  
    if (!token) {
      throw new Error("Sem token");
    }
  
    const res = await fetch("http://localhost:8000/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  
    if (!res.ok) {
      throw new Error("Token inválido");
    }
  
    return res.json();
  }
  