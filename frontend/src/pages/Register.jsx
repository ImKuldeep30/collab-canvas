import React from 'react'
import { Link } from "react-router-dom";
import {useState} from 'react'
import { useNavigate } from "react-router-dom";

const Register = () => {
  const navigate = useNavigate();

  const [Name,setname] = useState('')
  const [email,setemail] = useState('')
  const [password,setpassword] = useState('')
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  const submitHandler = async (e) => {
    e.preventDefault()
    const BACKEND_URL = 'http://192.168.1.10:3000/api/auth/register';
    console.log(Name)
    console.log(email)
    console.log(password)
    setLoading(true);
    setMessage("");
    try{
      const response = await fetch(BACKEND_URL,{
        method: 'POST',
        headers: {
          'Content-Type':'application/json'
        },
        body: JSON.stringify({
          name:Name,
          email:email,
          password:password
        })
      });
      
      const data = await response.json();

      console.log(data)

      if(response.ok){
        setIsError(false);
        setMessage(data.message|| "Registeration successful !")
        setname("")
        setemail("")
        setpassword("")
        setIsRegistered(true); 
        setTimeout(() => {
          navigate("/", { replace: true });
        }, 5000);
      }
      else{
        setIsError(true);
        setMessage(data.message || "Registration failed");
      }
    }
    catch(err){
      setIsError(true);
      setMessage("Server error. Try again.");
      setpassword("");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#171717] px-4">
        <div className=" w-full max-w-md p-8 rounded-2xl shadow-xl">
            <h1 className="text-3xl font-bold text-center text-white mb-2 p-5">
              Sign Up To Collab Hub
            </h1>

            <form onSubmit={(e)=>{submitHandler(e)}} className="space-y-4">
                <label>
                    <div className='text-white p-2'>User Name</div>
                    <div>
                        <input 
                            value={Name} 
                            onChange={(e)=>{
                              setname(e.target.value)
                            }}
                            placeholder='Name' 
                            required
                            className="w-full px-4 py-3 border text-white border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-[#242424] placeholder-gray-400"
                        />
                    </div>
                </label>
                
                <label>
                    <div className='text-white p-2'>Email address</div>
                    <div>
                        <input 
                            value={email} 
                            type='email'
                            onChange={(e)=>{
                              setemail(e.target.value)
                            }}
                            placeholder='Email' 
                            required
                            className="w-full px-4 py-3 border text-white border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-[#242424] placeholder-gray-400"
                        />
                    </div>
                </label>

                <label>
                    <div className='text-white p-2'>Password</div>
                    <div >
                        <input 
                          onChange={(e)=>{
                            setpassword(e.target.value)
                          }}
                          type='password'
                          value={password} 
                          placeholder='Password' 
                          required
                          className="w-full px-4 py-3 text-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-[#242424] placeholder-gray-400"
                        />
                    </div>
                </label>

                <div></div>

                {message && (
                  <p className={`text-center ${isError ? "text-red-500" : "text-green-500"}`}>
                    {message}
                  </p>
                )}

                <button 
                  disabled={loading || isRegistered}
                  className={`w-full py-3 rounded-lg text-sm font-semibold transition duration-300 
                  ${loading || isRegistered ? "bg-gray-500 cursor-not-allowed" : "bg-[#2865de] hover:bg-blue-800"}`}
                >
                  {loading ? "Creating..." : isRegistered ? "Email Sent ✓" : "Create Account"}
                </button>

                <h3 className="text-center text-sm text-gray-400">
                  Already have account? 
                  <span className="text-[#64a1e3]  cursor-pointer hover:underline ml-1">
                    <Link to="/">Log In</Link>
                  </span>
                </h3>
            </form>
        </div>
    </div>
  )
}

export default Register
