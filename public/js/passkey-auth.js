import { API_BASE_URL } from "/js/api-config.js";

export async function validatePasskey(inputPasskey, targetSide){
  const passkey = String(inputPasskey || "").trim();

  if(!passkey){
    return { ok:false, message:"Please enter your passkey." };
  }

  try{
    const response = await fetch(`${API_BASE_URL}/api/passkeys/validate`, {
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        passkey,
        targetSide
      })
    });

    const data = await response.json();

    return data;

  }catch(error){
    console.error(error);
    return {
      ok:false,
      message:"Could not connect to backend. Make sure the backend is running."
    };
  }
}
