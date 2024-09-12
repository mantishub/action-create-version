const https = require('https');

/**
 * Env variables from GitHub workflow input
 */
const params = {
    url: process.env['INPUT_URL'] || "",
    apiKey: process.env['INPUT_API-KEY'] || "",
    project: process.env['INPUT_PROJECT'] || "",
    name: process.env['INPUT_NAME'] || "",
    description: process.env['INPUT_DESCRIPTION'] || "",
    released: process.env['INPUT_RELEASED'] || "",
    obsolete: process.env['INPUT_OBSOLETE'] || "",
    timestamp: process.env['INPUT_TIMESTAMP'] || ""
};

/**
 * Main function
 *
 */
async function run() {
    if (!params.url || !params.apiKey || !params.project || !params.name) {
        throw new Error("Project name, url, api-key and name inputs are required.");
    }
    const newVersion = await createNewVersion(params);
    console.log(`::set-output name=version-id::${newVersion.version.id}`);
    return newVersion.version.id;
}

/**
 * Create a version in MantisHub
 *
 * @param data
 */
async function createNewVersion(data) {
    try {
        // validate request body for create version
        const validatedData = validateInput(data);
        // fetch project id from project name
        const projectID = await getProjectID(String(data.project));
        // Create a new version with placeholder name
        return await createVersion(projectID, validatedData);
    } catch (error) {
        console.error("Failed to create version:", error.message);
        if (error.response) {
            console.error("Error response data:", error.response.data);
        }
        process.exit(1);
    }
}

/**
 * HTTP Requests
 *
 * @param url
 * @param method 'GET', 'PATCH', 'POST'
 * @param body
 */
async function httpRequest(url, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
        let options = {
            method: method,
            headers: {
                'Authorization': params.apiKey,
                'Content-Type': 'application/json',
            }
        }
        if (body !== null) {
            options.body = JSON.stringify(body)
        }
        const req = https.request(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(data); // Resolve with the response data
                } else {
                    console.log(`Request failed with status code ${res.statusCode}: ${data}`)
                    reject(new Error(`Request failed with status code ${res.statusCode}: ${data}`));

                }
            });
        });
        if (body !== null) {
            req.write(JSON.stringify(body));
        }
        req.on('error', (e) => {
            reject(e); // Reject the promise with the error
        });
        req.end(); // End the request
    });
}

/**
 * Fetch projects from MantisHub
 */
async function fetchProjects() {
    const endpoint = `${params.url}/api/rest/projects`;
    console.log('Making request : ' + endpoint)
    const response = await httpRequest(endpoint); // Await the asynchronous call
    console.log(JSON.parse(response));
    return JSON.parse(response);
}

/**
 * Fetch projects and finds the input project name and returns the project id
 * @param projectName
 */
async function getProjectID(projectName) {
    try {
        const response = await fetchProjects();
        // Check if response.projects is empty
        if (!(Object.prototype.hasOwnProperty.call(response, "projects") && response.projects.length > 0)) {
            console.log(`No results found`);
            process.exit(1);
        }
        // use `find` to search for the project by name
        const project = response.projects.find(function (p) {
            return p.name === projectName;
        });
        if (project) {
            return project.id; // Return the project ID if found
        } else {
            console.error(`Project with name "${projectName}" not found.`);
            process.exit(1);
        }
    } catch (error) {
        console.error("Error fetching projects:", error.message);
        process.exit(1);
    }
}

/**
 * Creates a new version
 * @param projectID
 * @param body
 */
async function createVersion(projectID, body) {
    const endpoint = `${params.url}/api/rest/projects/${projectID}/versions`;
    console.log('Making POST request to create new version :' + endpoint)
    const response = await httpRequest(endpoint, 'POST', body);
    const responseBody = JSON.parse(response);
    console.log(responseBody);
    return responseBody;
}

/**
 * ===== Utility functions =======
 */
function validateInput(params) {
    const result = {};
        console.log(params)
    // Validate and set the 'name' parameter (required and must be a string)
    if (typeof params.name === 'string' && params.name.trim() !== '') {
        result.name = params.name.trim();
    } else {
        console.error("The 'name' parameter is required and must be a non-empty string.")
        process.exit(1)
    }

    // Validate and set the 'description' parameter (optional, must be a string)
    if (typeof params.description === 'string' && params.description.trim() !== '') {
        result.description = params.description.trim();
    }

    // Validate and set the 'released' parameter (optional, must be a boolean)
    if (typeof params.released === 'string' && (params.released.toLowerCase() === 'true' || params.released.toLowerCase() === 'false')) {
        result.released = params.released.toLowerCase() === 'true';
    }

    // Validate and set the 'obsolete' parameter (optional, must be a boolean)
    if (typeof params.obsolete === 'string' && (params.obsolete.toLowerCase() === 'true' || params.obsolete.toLowerCase() === 'false')) {
        result.obsolete = params.obsolete.toLowerCase() === 'true';
    }

    // Validate and set the 'timestamp' parameter (optional, must be a valid datetime string)
    if (typeof params.timestamp === 'string' && !isNaN(new Date(params.timestamp).getTime())) {
        result.timestamp = new Date(params.timestamp).toISOString(); // Ensure it's in ISO format
    }
    return result;
}
run();
