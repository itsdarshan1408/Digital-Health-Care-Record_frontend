import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../utils/axiosInstance';
import { getSocket } from '../utils/socket';
import { Plus, Heart, MessageCircle, Trophy, Users, Send, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const Community = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [newPost, setNewPost] = useState('');
  const [commentText, setCommentText] = useState({});

  useEffect(() => {
    fetchData();

    // Socket.io listeners
    const socket = getSocket();
    if (socket) {
      socket.on('post-created', handleNewPost);
      socket.on('post-updated', handlePostUpdate);
    }

    return () => {
      if (socket) {
        socket.off('post-created');
        socket.off('post-updated');
      }
    };
  }, []);

  const fetchData = async () => {
    try {
      const [postsRes, challengesRes] = await Promise.all([
        axiosInstance.get('/community/posts'),
        axiosInstance.get('/community/challenges'),
      ]);
      setPosts(postsRes.data);
      setChallenges(challengesRes.data);
    } catch (error) {
      toast.error('Failed to fetch community data');
    }
  };

  const handleNewPost = (post) => {
    setPosts((prev) => [post, ...prev]);
  };

  const handlePostUpdate = (updatedPost) => {
    setPosts((prev) =>
      prev.map((p) => (p._id === updatedPost._id ? updatedPost : p))
    );
  };

  const createPost = async () => {
    if (!newPost.trim()) return;

    try {
      const { data } = await axiosInstance.post('/community/posts', {
        content: newPost,
      });
      
      const socket = getSocket();
      if (socket) {
        socket.emit('new-post', data);
      }

      setPosts([data, ...posts]);
      setNewPost('');
      toast.success('Post created!');
    } catch (error) {
      toast.error('Failed to create post');
    }
  };

  const toggleLike = async (postId) => {
    try {
      const { data } = await axiosInstance.put(`/community/posts/${postId}/like`);
      
      const socket = getSocket();
      if (socket) {
        socket.emit('post-liked', data);
      }

      setPosts((prev) =>
        prev.map((p) => (p._id === postId ? data : p))
      );
    } catch (error) {
      toast.error('Failed to like post');
    }
  };

  const addComment = async (postId) => {
    if (!commentText[postId]?.trim()) return;

    try {
      const { data } = await axiosInstance.post(
        `/community/posts/${postId}/comment`,
        { text: commentText[postId] }
      );

      setPosts((prev) =>
        prev.map((p) => (p._id === postId ? data : p))
      );

      setCommentText({ ...commentText, [postId]: '' });
      toast.success('Comment added!');
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  const deletePost = async (postId) => {
    if (!window.confirm('Delete this post?')) return;

    try {
      await axiosInstance.delete(`/community/posts/${postId}`);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
      toast.success('Post deleted');
    } catch (error) {
      toast.error('Failed to delete post');
    }
  };

  const joinChallenge = async (challengeId) => {
    try {
      await axiosInstance.post(`/community/challenges/${challengeId}/join`);
      toast.success('Joined challenge!');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to join challenge');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Community
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Connect with others on their wellness journey
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('posts')}
          className={`pb-3 px-1 font-medium transition ${
            activeTab === 'posts'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <Users className="w-5 h-5 inline mr-2" />
          Posts
        </button>
        <button
          onClick={() => setActiveTab('challenges')}
          className={`pb-3 px-1 font-medium transition ${
            activeTab === 'challenges'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <Trophy className="w-5 h-5 inline mr-2" />
          Challenges
        </button>
      </div>

      {/* Posts Tab */}
      {activeTab === 'posts' && (
        <div className="space-y-6">
          {/* Create Post */}
          <div className="card">
            <div className="flex space-x-3">
              <img
                src={user?.avatar}
                alt={user?.name}
                className="w-10 h-10 rounded-full"
              />
              <div className="flex-1">
                <textarea
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  placeholder="Share your wellness journey..."
                  rows="3"
                  className="input-field resize-none"
                ></textarea>
                <button
                  onClick={createPost}
                  className="btn-primary mt-3 flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Post</span>
                </button>
              </div>
            </div>
          </div>

          {/* Posts Feed */}
          {posts.length === 0 ? (
            <div className="card text-center py-12">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p className="text-gray-600 dark:text-gray-400">
                No posts yet. Be the first to share!
              </p>
            </div>
          ) : (
            posts.map((post) => (
              <div key={post._id} className="card">
                {/* Post Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <img
                      src={post.userId?.avatar}
                      alt={post.userId?.name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {post.userId?.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {format(new Date(post.createdAt), 'MMM dd, yyyy · h:mm a')}
                      </p>
                    </div>
                  </div>
                  {post.userId?._id === user?._id && (
                    <button
                      onClick={() => deletePost(post._id)}
                      className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  )}
                </div>

                {/* Post Content */}
                <p className="text-gray-800 dark:text-gray-200 mb-4 whitespace-pre-wrap">
                  {post.content}
                </p>

                {/* Post Image */}
                {post.image && (
                  <img
                    src={post.image}
                    alt="Post"
                    className="rounded-lg mb-4 w-full"
                  />
                )}

                {/* Post Actions */}
                <div className="flex items-center space-x-6 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => toggleLike(post._id)}
                    className={`flex items-center space-x-2 transition ${
                      post.likes?.includes(user?._id)
                        ? 'text-red-600'
                        : 'text-gray-600 dark:text-gray-400 hover:text-red-600'
                    }`}
                  >
                    <Heart
                      className="w-5 h-5"
                      fill={post.likes?.includes(user?._id) ? 'currentColor' : 'none'}
                    />
                    <span className="text-sm">{post.likes?.length || 0}</span>
                  </button>

                  <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-sm">{post.comments?.length || 0}</span>
                  </div>
                </div>

                {/* Comments */}
                {post.comments && post.comments.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {post.comments.map((comment, idx) => (
                      <div key={idx} className="flex space-x-3">
                        <img
                          src={comment.userId?.avatar}
                          alt={comment.userId?.name}
                          className="w-8 h-8 rounded-full"
                        />
                        <div className="flex-1 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                          <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                            {comment.userId?.name}
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {comment.text}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Comment */}
                <div className="mt-4 flex space-x-2">
                  <input
                    type="text"
                    value={commentText[post._id] || ''}
                    onChange={(e) =>
                      setCommentText({ ...commentText, [post._id]: e.target.value })
                    }
                    placeholder="Add a comment..."
                    className="flex-1 input-field"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') addComment(post._id);
                    }}
                  />
                  <button
                    onClick={() => addComment(post._id)}
                    className="btn-primary"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Challenges Tab */}
      {activeTab === 'challenges' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {challenges.length === 0 ? (
            <div className="col-span-2 card text-center py-12">
              <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p className="text-gray-600 dark:text-gray-400">
                No active challenges
              </p>
            </div>
          ) : (
            challenges.map((challenge) => (
              <div key={challenge._id} className="card">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {challenge.title}
                  </h3>
                  <Trophy className="w-6 h-6 text-yellow-500" />
                </div>

                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {challenge.description}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Goal:</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {challenge.goal} {challenge.type}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Participants:
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {challenge.participants?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Ends:</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {format(new Date(challenge.endDate), 'MMM dd, yyyy')}
                    </span>
                  </div>
                </div>

                {/* Leaderboard */}
                {challenge.leaderboard && challenge.leaderboard.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-sm mb-2 text-gray-900 dark:text-gray-100">
                      🏆 Leaderboard
                    </h4>
                    <div className="space-y-1">
                      {challenge.leaderboard.slice(0, 3).map((entry) => (
                        <div
                          key={entry._id}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-gray-700 dark:text-gray-300">
                            #{entry.rank} {entry.userId?.name}
                          </span>
                          <span className="font-semibold text-primary-600">
                            {entry.score}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => joinChallenge(challenge._id)}
                  className="w-full btn-primary"
                  disabled={challenge.participants?.some(
                    (p) => p.userId === user?._id
                  )}
                >
                  {challenge.participants?.some((p) => p.userId === user?._id)
                    ? 'Already Joined'
                    : 'Join Challenge'}
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Community;
