using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;

namespace mainbackend.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly string _connectionString = "Data Source=predictflow.db";

        public AuthController()
        {
            //this creates the table at runtime if it does not exist
            using var connection = new SqliteConnection(_connectionString);
            connection.Open();
            var command = connection.CreateCommand();
            command.CommandText = @"
                CREATE TABLE IF NOT EXISTS Users (
                    Id INTEGER PRIMARY KEY AUTOINCREMENT,
                    Name TEXT NOT EXISTS,
                    Email TEXT UNIQUE NOT NULL,
                    Password TEXT NOT EXISTS
                );";
            command.ExecuteNonQuery();
        }

        [HttpPost("register")]
        public IActionResult Register([FromBody] RegisterDto model)
        {
            try
            {
                using var connection = new SqliteConnection(_connectionString);
                connection.Open();
                var command = connection.CreateCommand();
                command.CommandText = "INSERT INTO Users (Name, Email, Password) VALUES ($name, $email, $password)";
                command.Parameters.AddWithValue("$name", model.Name);
                command.Parameters.AddWithValue("$email", model.Email);
                command.Parameters.AddWithValue("$password", model.Password); // plaintext 
                command.ExecuteNonQuery();

                return Ok(new { status = "success", name = model.Name });
            }
            catch (SqliteException ex) when (ex.SqliteErrorCode == 19) // constraint violation
            {
                return BadRequest(new { detail = "Email already registered." });
            }
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginDto model)
        {
            using var connection = new SqliteConnection(_connectionString);
            connection.Open();
            var command = connection.CreateCommand();
            command.CommandText = "SELECT Name FROM Users WHERE Email = $email AND Password = $password";
            command.Parameters.AddWithValue("$email", model.Email);
            command.Parameters.AddWithValue("$password", model.Password);

            using var reader = command.ExecuteReader();
            if (reader.Read())
            {
                var name = reader.GetString(0);
                return Ok(new { status = "success", name = name });
            }

            return Unauthorized(new { detail = "Invalid credentials." });
        }
    }

    public class RegisterDto
    {
        public string? Name { get; set; }
        public string? Email { get; set; }
        public string? Password { get; set; }
    }
    public class LoginDto
    {
        public string? Email { get; set; }

        public string? Password { get; set; }
    }
}
