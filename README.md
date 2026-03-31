# WeCode

A web app for browsing programming challenges. You get a challenge, 
try to solve it, and the solution stays hidden until you explicitly 
give up. Built with vanilla HTML, CSS, and JavaScript on the frontend, 
no frameworks.

## Submission

Live URLs:
- Load balancer:
- web-01 direct:
- web-02 direct:
- Domain HTTP:
- Domain HHTPS: 

GitHub repo:
Demo video:

---

## What it does

You can get a random challenge, search by name or pick from a dropdown 
list, or filter by difficulty (Beginner, Intermediate, Expert). Each 
challenge shows the description and test cases. There's a built-in JS 
editor where you can write a solution and run it against the test cases 
directly in the browser. If you give up, you pick a language and the 
solution appears.

The app also has a local fallback file (challenges.json) that kicks in 
if the API is unavailable or the rate limit is hit, so it doesn't just 
die on you.

## API

Programming Challenges API by zizaaa, available on RapidAPI:
https://rapidapi.com/zizaaa/api/programming-challenges

The API returns challenges with descriptions, test cases, and solutions 
in JavaScript, Python, Java, and C++. No backend is involved on the 
client side. The key lives in config.js which is gitignored.

## Running it locally

1. Clone the repo
2. Create a file called config.js in the project root:
```
const RAPIDAPI_KEY = 'your_key_here';
const RAPIDAPI_HOST = 'programming-challenges.p.rapidapi.com';
```

3. Subscribe to the free plan at:
   https://rapidapi.com/zizaaa/api/programming-challenges

4. Paste your key into config.js

5. Open index.html in your browser. That's it, no build step.

If you don't want to use the API at all, the app falls back to 
challenges.json automatically when API calls fail.

## Deployment

The app is deployed on two Ubuntu web servers behind an HAproxy load 
balancer. All three are AWS instances.

- web-01: 3.89.112.43
- web-02: 100.26.99.147
- lb-01 (load balancer): 3.83.152.64

To deploy, copy the project files to each web server:
```
scp -r wecode/ ubuntu@3.89.112.43:~/
scp -r wecode/ ubuntu@100.26.99.147:~/
```

Then on each server, move the files to the Nginx web root:
```
sudo cp -r ~/wecode/* /var/www/html/
```

Nginx serves the static files on port 80. HAproxy on lb-01 distributes 
incoming traffic between web-01 and web-02 using round robin. You can 
verify load balancing is working by checking the X-Served-By header:
```
curl -sI 3.83.152.64 | grep x-served-by
```

Run it twice and you'll see it alternate between 6974-web-01 and 
6974-web-02.

## Challenges

The main headache during development was the API rate limit. The free 
tier runs out fast, especially when testing the search dropdown which 
fetches the full list of challenges. Kept hitting 429 errors mid-session 
and had to create new RapidAPI accounts with different emails to get a 
fresh key each time. Eventually built the challenges.json fallback so 
the app could keep working even when the API was exhausted.

The solution data also came back as an array containing an object instead 
of a plain object, which wasn't obvious from the docs. The dropdown was 
showing "0" as the only option because Object.keys() on an array returns 
the indices, not the property names. Took some console.log digging to 
figure that out.

The single-page app structure meant browser history navigation didn't 
work out of the box either. history.back() does nothing when you haven't 
actually changed URLs, so had to track the previous section manually and 
wire up the back button to that instead.

## Credits

- Programming Challenges API: https://rapidapi.com/zizaaa/api/programming-challenges
- HAproxy: https://www.haproxy.org
- Nginx: https://nginx.org