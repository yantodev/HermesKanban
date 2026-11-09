from __future__ import annotations


def test_board_crud_switch_and_metadata(client):
    r = client.post('/api/boards', json={
        'slug': 'project-alpha',
        'name': 'Project Alpha',
        'description': 'Readable project board',
        'icon': '🚀',
        'color': '#0d74ce',
        'switch': True,
    })
    assert r.status_code == 200, r.text
    assert r.json()['current'] == 'project-alpha'

    boards = client.get('/api/boards').json()
    slugs = [b['slug'] for b in boards['boards']]
    assert 'default' in slugs and 'project-alpha' in slugs

    detail = client.get('/api/boards/project-alpha').json()['board']
    assert detail['name'] == 'Project Alpha'
    assert detail['is_current'] is True

    patched = client.patch('/api/boards/project-alpha', json={'name': 'Alpha Ops'}).json()['board']
    assert patched['name'] == 'Alpha Ops'

    switched = client.post('/api/boards/default/switch').json()
    assert switched['current'] == 'default'

    deleted = client.delete('/api/boards/project-alpha').json()['result']
    assert deleted['action'] == 'archived'


def test_review_column_is_exposed_and_tasks_can_enter_review(client):
    config = client.get('/api/config')
    assert config.status_code == 200, config.text
    assert 'review' in config.json()['columns']

    created = client.post('/api/tasks', json={'title': 'Awaiting human review', 'assignee': 'dev'})
    assert created.status_code == 200, created.text
    task_id = created.json()['task']['id']

    moved = client.patch(f'/api/tasks/{task_id}', json={'status': 'review'})
    assert moved.status_code == 200, moved.text
    assert moved.json()['task']['status'] == 'review'

    response = client.get('/api/board', params={'board': 'default'})
    assert response.status_code == 200, response.text
    assert 'review' in response.json()['column_order']
    assert any(item['id'] == task_id for item in response.json()['columns']['review'])


def test_board_view_accepts_empty_frontend_filters(client):
    created = client.post('/api/tasks', json={'title': 'Visible task', 'assignee': 'dev'})
    assert created.status_code == 200, created.text

    response = client.get(
        '/api/board',
        params={
            'board': 'default',
            'include_archived': 'false',
            'q': '',
            'assignee': '',
        },
    )
    assert response.status_code == 200, response.text
    assert any(task['title'] == 'Visible task' for task in response.json()['tasks'])
