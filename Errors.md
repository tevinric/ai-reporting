Traceback (most recent call last):
  File "C:\Users\E100545\Git\ai-reporting\backend\app.py", line 827, in <module>
    @app.route('/api/custom-metrics', methods=['GET'])
     ~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\E100545\Git\ai-reporting\backend\.venv\Lib\site-packages\flask\sansio\scaffold.py", line 364, in decorator
    self.add_url_rule(rule, endpoint, f, **options)
    ~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\E100545\Git\ai-reporting\backend\.venv\Lib\site-packages\flask\sansio\scaffold.py", line 44, in wrapper_func
    return f(self, *args, **kwargs)
  File "C:\Users\E100545\Git\ai-reporting\backend\.venv\Lib\site-packages\flask\sansio\app.py", line 659, in add_url_rule
    raise AssertionError(
    ...<2 lines>...
    )
AssertionError: View function mapping is overwriting an existing endpoint function: get_custom_metrics