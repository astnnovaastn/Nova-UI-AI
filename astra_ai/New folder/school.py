import requests
r= requests.get
('https://jsonplaceholder.typicode.com/posts')
posts = r.json()
print(posts)
for post in posts:
    print(post['title'])
    print(post['body'])
    print('---')
# This code fetches a list of posts from a placeholder API and prints the title and body of each post.
# It uses the requests library to make an HTTP GET request and processes the JSON response.
    