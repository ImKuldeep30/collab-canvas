import React from 'react'
import { Link } from "react-router-dom";
import {useState} from 'react'
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const Login = () => {
  const navigate = useNavigate();

  // agr already login hai to 
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      navigate("/main", { replace: true });
    }
  }, [navigate]);

  const [email,setemail] = useState('')
  const [password,setpassword] = useState('')
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const submitHandler = async (e) => {
    e.preventDefault()
    const BACKEND_URL = 'http://192.168.1.10:3000/api/auth/login';
    console.log(email)
    console.log(password)
    setLoading(true);
    try{
      const response = await fetch(BACKEND_URL,{
        method: 'POST',
        headers: {
          'Content-Type':'application/json'
        },
        body: JSON.stringify({
          email:email,
          password:password
        })
      });
      
      const data = await response.json();
      
      if(response.ok){
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        localStorage.setItem("user", JSON.stringify(data.user));
        setIsError(false);
        setMessage("Login successful!");
        setLoading(false);

        navigate("/main", { replace: true }); // redirect to main page
      }
      else{
        setIsError(true);
        setMessage(data.message || "Login failed");
        setpassword("");
        setLoading(false);
      }
    }
    catch(err){
      setIsError(true);
      setMessage("Server error. Try again.");
      setpassword("");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#171717] px-4">
        <div className=" w-full max-w-md p-8 rounded-2xl shadow-xl">
            <h1 className="text-3xl font-bold text-center text-white mb-2 p-5">
              Log into Collab Hub
            </h1>

            <form onSubmit={(e)=>{submitHandler(e)}} className="space-y-4">
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
                  disabled={loading}
                  className="w-full bg-[#2865de] text-white py-3 rounded-lg text-sm font-semibold hover:bg-blue-800 transition duration-300 "
                >
                  {loading ? "Logging in..." : "Log In"}
                </button>

                <span className="block text-right text-sm text-[#64a1e3] hover:underline cursor-pointer">
                  <Link to="/forget-password">Forget Password</Link>
                </span>

                <h3 className="text-center text-sm text-gray-400">
                  don't have account? 
                  <span className="text-[#64a1e3]  cursor-pointer hover:underline ml-1">
                    <Link to="/Register">Create Account</Link>
                  </span>
                </h3>
            </form>
        </div>
    </div>
  )
}

export default Login
