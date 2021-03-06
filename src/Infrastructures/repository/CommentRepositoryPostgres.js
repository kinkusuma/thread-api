const CommentRepository = require('../../Domains/comments/CommentRepository');
const AddedComment = require('../../Domains/comments/entities/AddedComment');
const Comment = require('../../Domains/comments/entities/Comment');
const Reply = require('../../Domains/replies/entities/Reply');
const NotFoundError = require('../../Commons/exceptions/NotFoundError');

class CommentRepositoryPostgres extends CommentRepository {
  constructor(pool, idGenerator) {
    super();
    this._idGenerator = idGenerator;
    this._pool = pool;
  }

  async addComment({ postId, content, owner }) {
    const id = `comment-${this._idGenerator()}`;
    const date = new Date().toISOString();
    const query = {
      text: 'INSERT INTO comments VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, username, content',
      values: [postId, id, owner, date, content, false],
    };
    const result = await this._pool.query(query);
    return new AddedComment({ ...result.rows[0] });
  }

  async deleteComment(commentId, postId) {
    const query = {
      text: 'UPDATE comments SET is_delete = $1 WHERE id = $2 and post_id = $3',
      values: [true, commentId, postId],
    };
    await this._pool.query(query);
  }

  async getCommentByPostId(postId) {
    const query = {
      text: 'SELECT a.id, a.content, b.username, a.date, a.is_delete FROM comments as a inner join users as b on a.username = b.id WHERE a.post_id = $1 ORDER BY date',
      values: [postId],
    };
    const result = await this._pool.query(query);
    return result.rows.map((row) => new Comment({ ...row, isDelete: row.is_delete }));
  }

  async getCommentByOtherCommentId(commentId) {
    const query = {
      text: 'SELECT a.id, a.content, b.username, a.date, a.is_delete FROM comments as a inner join users as b on a.username = b.id WHERE a.post_id = $1 ORDER BY date',
      values: [commentId],
    };
    const result = await this._pool.query(query);
    return result.rows.map((row) => new Reply({ ...row, isDelete: row.is_delete }));
  }

  async getCommentById(id) {
    const query = {
      text: 'SELECT a.id, a.content, b.username, a.date, a.is_delete FROM comments as a inner join users as b on a.username = b.id WHERE a.id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('komentar tidak ditemukan');
    }
    return new Comment({ ...result.rows[0], isDelete: result.rows[0].is_delete });
  }
}

module.exports = CommentRepositoryPostgres;
