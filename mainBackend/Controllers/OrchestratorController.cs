using Microsoft.AspNetCore.Mvc;
using System.Net.Http;
using System.Threading.Tasks;

namespace mainbackend.Controllers
{
    [ApiController]
    [Route("api/orchestrate")]
    public class OrchestratorController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;

        public OrchestratorController(IHttpClientFactory httpClientFactory)
        {
            _httpClientFactory = httpClientFactory;
        }

        [HttpPost("run")]
        public async Task<IActionResult> ForwardToPython([FromForm] IFormFile file, [FromForm] string prompt)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded.");

            var client = _httpClientFactory.CreateClient();
            
            // for pack the file and fastapi from python to this class 
            using var content = new MultipartFormDataContent();
            
            using var stream = file.OpenReadStream();
            var streamContent = new StreamContent(stream);
            streamContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(file.ContentType);
            
            content.Add(streamContent, "file", file.FileName);
            content.Add(new StringContent(prompt), "prompt");

            // post the request to local fastapi from python 
            var response = await client.PostAsync("http://127.0.0", content);

            if (!response.IsSuccessStatusCode)
            {
                var errorMsg = await response.Content.ReadAsStringAsync();
                return StatusCode((int)response.StatusCode, $"Python Error: {errorMsg}");
            }

            var jsonResult = await response.Content.ReadAsStringAsync();
            return Content(jsonResult, "application/json");
        }
    }
}
