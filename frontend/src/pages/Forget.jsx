import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Forget = () => {
  const navigate = useNavigate();

  const [email, setemail] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const submitHandler = async (e) => {
    e.preventDefault();
    if (isSubmitted) return;
    const BACKEND_URL = "http://192.168.1.10:3000/api/auth/forgot-password";
    console.log(email);
    setLoading(true);
    try {
      const response = await fetch(BACKEND_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsError(false);
        setIsSubmitted(true);
        setMessage(
          "If this email exists, a password reset link has been sent.",
        );
        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 5000);
      } else {
        setIsError(true);
        setIsSubmitted(true);
        setMessage(
          "If this email exists, a password reset link has been sent.",
        );
      }
    } catch (err) {
      setIsError(true);
      setMessage("Server error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#171717] px-4">
      <div className=" w-full max-w-md p-8 rounded-2xl shadow-xl">
        <h1 className="text-3xl font-bold text-center text-white mb-2 p-5">
          Password Reset
        </h1>

        <p className="text-gray-500 font-semibold text-center">
          A Password Reset Link will be sent to email address provided below
        </p>

        <form
          onSubmit={(e) => {
            submitHandler(e);
          }}
          className="space-y-4"
        >
          <label>
            <div className="text-white p-2">Email address</div>
            <div>
              <input
                value={email}
                type="email"
                onChange={(e) => {
                  setemail(e.target.value);
                }}
                placeholder="Email"
                required
                className="w-full px-4 py-3 border text-white border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-[#242424] placeholder-gray-400"
              />
            </div>
          </label>

          <div></div>

          {message && (
            <p
              className={`text-center ${isError ? "text-red-500" : "text-green-500"}`}
            >
              {message}
            </p>
          )}

          <button
            disabled={loading || isSubmitted}
            className={`w-full text-white py-3 rounded-lg text-sm font-semibold transition duration-300 
                    ${
                      loading || isSubmitted
                        ? "bg-gray-500 cursor-not-allowed"
                        : "bg-[#2865de] hover:bg-blue-500"
                    }`}
          >
            {loading ? "Sending..." : isSubmitted ? "Email Sent ✓" : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Forget;

