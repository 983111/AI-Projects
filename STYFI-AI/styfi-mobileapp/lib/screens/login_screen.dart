import 'package:flutter/material.dart';
<<<<<<< HEAD
import 'package:google_fonts/google_fonts.dart';
=======
>>>>>>> 9b3456e6285ce023c13c7915bd9d5a11a4f51582
import '../services/auth_service.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passController = TextEditingController();
  final _authService = AuthService();
  bool _isLogin = true;
  bool _isLoading = false;

  void _submit() async {
    setState(() => _isLoading = true);
    String? error;
    if (_isLogin) {
      error = await _authService.signIn(
        _emailController.text.trim(), 
        _passController.text.trim()
      );
    } else {
      error = await _authService.signUp(
        _emailController.text.trim(), 
        _passController.text.trim()
      );
    }
    setState(() => _isLoading = false);

    if (error != null && mounted) {
<<<<<<< HEAD
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error), backgroundColor: Colors.red),
      );
=======
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error)));
>>>>>>> 9b3456e6285ce023c13c7915bd9d5a11a4f51582
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
<<<<<<< HEAD
      backgroundColor: const Color(0xFFFFF1F2),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Icon(Icons.auto_awesome, size: 60, color: const Color(0xFFE11D48)),
              const SizedBox(height: 20),
              Text(
                _isLogin ? "Welcome Back" : "Join Styfi",
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.black87),
              ),
              const SizedBox(height: 10),
              Text(
                _isLogin ? "Login to access your fashion world" : "Create an account to start shopping",
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(fontSize: 16, color: Colors.grey[600]),
              ),
              const SizedBox(height: 40),
              TextField(
                controller: _emailController,
                decoration: InputDecoration(
                  labelText: "Email",
                  prefixIcon: const Icon(Icons.email_outlined),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  filled: true,
                  fillColor: Colors.white,
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _passController,
                obscureText: true,
                decoration: InputDecoration(
                  labelText: "Password",
                  prefixIcon: const Icon(Icons.lock_outline),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  filled: true,
                  fillColor: Colors.white,
                ),
              ),
              const SizedBox(height: 24),
              SizedBox(
                height: 50,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFE11D48),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    elevation: 2,
                  ),
                  child: _isLoading 
                    ? const CircularProgressIndicator(color: Colors.white) 
                    : Text(_isLogin ? "Login" : "Sign Up", style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                ),
              ),
              const SizedBox(height: 20),
              TextButton(
                onPressed: () => setState(() => _isLogin = !_isLogin),
                child: RichText(
                  text: TextSpan(
                    text: _isLogin ? "Don't have an account? " : "Already have an account? ",
                    style: TextStyle(color: Colors.grey[700]),
                    children: [
                      TextSpan(
                        text: _isLogin ? "Sign Up" : "Login",
                        style: const TextStyle(color: Color(0xFFE11D48), fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ),
              )
            ],
          ),
=======
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(_isLogin ? "Welcome Back" : "Create Account", 
              style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold)),
            const SizedBox(height: 24),
            TextField(
              controller: _emailController,
              decoration: const InputDecoration(labelText: "Email", border: OutlineInputBorder()),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _passController,
              obscureText: true,
              decoration: const InputDecoration(labelText: "Password", border: OutlineInputBorder()),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _submit,
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFE11D48), foregroundColor: Colors.white),
                child: _isLoading 
                  ? const CircularProgressIndicator(color: Colors.white) 
                  : Text(_isLogin ? "Login" : "Sign Up"),
              ),
            ),
            TextButton(
              onPressed: () => setState(() => _isLogin = !_isLogin),
              child: Text(_isLogin ? "Need an account? Sign Up" : "Have an account? Login"),
            )
          ],
>>>>>>> 9b3456e6285ce023c13c7915bd9d5a11a4f51582
        ),
      ),
    );
  }
<<<<<<< HEAD
}
=======
}
>>>>>>> 9b3456e6285ce023c13c7915bd9d5a11a4f51582
