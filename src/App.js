// //Importa o que é necessário para Configurar o amplify para ter acesso aos recursosaws criados no projeto
// import Amplify from 'aws-amplify'
// import config from './aws-exports'

// //Adiciona o import para utilizar o autenticador via cognito do projeto
// import { withAuthenticator } from '@aws-amplify/ui-react'
// import '@aws-amplify/ui-react/styles.css'
// import logo from './logo.svg';
// import './App.css';
// import { API, Auth } from 'aws-amplify'
// import React, { useState, useEffect } from 'react';

// //importa a definição das queries criadas
// import { listPosts } from './graphql/queries'

// //Configura o amplify para ter acesso aos recursos aws criados no projeto
// Amplify.configure(config)

// function App({ signOut, user }) {
//   const [posts, setPosts] = useState([])
  
//   //modifique a função useEffect() para incluir a chamada de função checkUser()
//   useEffect(()=> {
//     checkUser();
//     fetchPosts();
//   });
  
//   //defina a funcao checkUserapós a função fetchPosts() existente
//   async function checkUser() {
//     const user = await Auth.currentAuthenticatedUser();
//     console.log('user:', user);
//     console.log('user attributes: ', user.attributes);
//   }
  
//   async function fetchPosts() {
//     try{
//       const postData = await API.graphql({ query: listPosts });
//       setPosts(postData.data.listPosts.items)
//     } catch (err) {
//       console.log({err});
//     }
//   }
//   return (
//     <div>
//       <h1>Hello World</h1>
//       {
//         posts.map(post => (
//           <div key={post.id}>
//             <h1>{post.name}</h1>
//             <h1>{post.location}</h1>
//           </div>
//         ))
//       }
//       <button onClick={signOut}>Sign Out</button>
//     </div>
//   );
// }

// //Força qualquer acesso ao app a ser autenticado
// export default withAuthenticator(App);
// App.js

// Importa o que é necessário para Configurar o amplify para ter acesso aos recursos aws criados no projeto
import Amplify from 'aws-amplify'
import config from './aws-exports'

import React, { useState, useEffect } from "react";
import {
  HashRouter,
  Switch,
  Route
} from "react-router-dom";
import { withAuthenticator } from '@aws-amplify/ui-react';
import { css } from '@emotion/css';
import { API, Storage, Auth } from 'aws-amplify';
import '@aws-amplify/ui-react/styles.css';
import { listPosts } from './graphql/queries';

import Posts from './Posts';
import Post from './Post';
import Header from './Header';
import CreatePost from './CreatePost';
import Button from './Button';

// Configura o amplify para ter acesso aos recursos aws criados no projeto
Amplify.configure(config)

function Router({user, signOut}) {

  /* create a couple of pieces of initial state */
  const [showOverlay, updateOverlayVisibility] = useState(false);
  const [posts, updatePosts] = useState([]);
  const [myPosts, updateMyPosts] = useState([]);

  /* fetch posts when component loads */
  useEffect(() => {
      fetchPosts();
  }, []);

  async function fetchPosts() {

    /* query the API, ask for 100 items */
    let postData = await API.graphql({ query: listPosts, variables: { limit: 100 }});
    let postsArray = postData.data.listPosts.items;

    /* map over the image keys in the posts array, get signed image URLs for each image */
    postsArray = await Promise.all(postsArray.map(async post => {
      const imageKey = await Storage.get(post.image);
      post.image = imageKey;
      return post;
    }));

    /* update the posts array in the local state */
    setPostState(postsArray);
  }
  
  async function setPostState(postsArray) {
    const user = await Auth.currentAuthenticatedUser();
    const myPostData = postsArray.filter(p => p.owner === user.username);
    updateMyPosts(myPostData);
    updatePosts(postsArray);
  }

  return (
    <>
      <HashRouter>
          <div className={contentStyle}>
            <Header />
            <hr className={dividerStyle} />
            <Button title="New Post" onClick={() => updateOverlayVisibility(true)} />
            <Switch>
              <Route exact path="/" >
                <Posts posts={posts} />
              </Route>
              <Route exact path="/myposts" >
                <Posts posts={myPosts} />
              </Route>
              <Route path="/post/:id" >
                <Post />
              </Route>
            </Switch>
          </div>
          <button onClick={signOut}>Sign out</button>
        </HashRouter>
        { showOverlay && (
          <CreatePost
            updateOverlayVisibility={updateOverlayVisibility}
            updatePosts={setPostState}
            posts={posts}
          />
        )}
    </>
  );
}

const dividerStyle = css`
  margin-top: 15px;
`

const contentStyle = css`
  min-height: calc(100vh - 45px);
  padding: 0px 40px;
`

export default withAuthenticator(Router);
