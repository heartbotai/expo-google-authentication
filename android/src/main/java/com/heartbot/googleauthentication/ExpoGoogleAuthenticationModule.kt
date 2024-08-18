package com.heartbot.googleauthentication

import android.util.Log
import android.content.Context
import androidx.credentials.ClearCredentialStateRequest
import androidx.credentials.Credential
import androidx.credentials.CredentialManager
import androidx.credentials.CredentialOption
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialResponse
import androidx.credentials.GetCredentialRequest
import androidx.credentials.exceptions.ClearCredentialException
import androidx.credentials.exceptions.GetCredentialCancellationException
import androidx.credentials.exceptions.GetCredentialException
import androidx.credentials.exceptions.NoCredentialException
import com.google.android.gms.common.ConnectionResult
import com.google.android.gms.common.GoogleApiAvailability
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.google.android.libraries.identity.googleid.GoogleIdTokenParsingException
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class ExpoGoogleAuthenticationModule : Module() {
  val TAG = "ExpoGoogleAuthenticationModule"
  var configureOptions: ConfigureOptions? = null
  var credentialManager: CredentialManager? = null
  var context: Context? = null
    get() = appContext.activityProvider?.currentActivity

  enum class LoginType {
    WITH_BUTTON,
    WITHOUT_BUTTON
  }  

  class ConfigureOptions: Record {
    @Field
    var webClientId: String = ""

    @Field
    var nonce: String? = ""

    @Field
    var profileImageSize: Int? = 120
  }

  // Each module class must implement the definition function. The definition consists of components
  // that describes the module's functionality and behavior.
  // See https://docs.expo.dev/modules/module-api for more details about available components.
  override fun definition() = ModuleDefinition {

    // Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument.
    // Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.
    // The module will be accessible from `requireNativeModule('ExpoGoogleAuthentication')` in JavaScript.
    Name("ExpoGoogleAuthentication")

    Function("configure", this@ExpoGoogleAuthenticationModule::configure)
    AsyncFunction("loginWithoutUserAction", this@ExpoGoogleAuthenticationModule::loginWithoutUserAction)
    AsyncFunction("loginFromUserAction", this@ExpoGoogleAuthenticationModule::loginFromUserAction)
    AsyncFunction("logout", this@ExpoGoogleAuthenticationModule::logout)
  }

  // Initializes the CredentialManager and saves a reference to configuration options for later use.
  private fun configure(options: ConfigureOptions) {
    // Save the options for later use
    configureOptions = options

    if (context == null) {
      throw CodedException("Android context is not available.")
    }

    credentialManager = CredentialManager.create(context!!)
  }

  // Google sign-in has different flows for logging in with a button and without a button.
  // The key difference is intent. When the user shows intent to login with Google then the
  // UX will differ slightly. For example, the user will have the option to create an account 
  // if they don't have one.
  private fun loginFromUserAction(promise: Promise) {
    loginBase(LoginType.WITH_BUTTON, 0, promise)
  }

  private fun loginWithoutUserAction(promise: Promise) {
    loginBase(LoginType.WITHOUT_BUTTON, 0, promise)
  }

  private fun validateLoginDependencies(): CodedException? {
    val webClientId: String? = configureOptions?.webClientId

    // CodedException is a custom exception that requires an exception.
    val emptyException = Exception("")

    if (context == null) {
      return CodedException("ERR_INVALID_ENVIRONMENT", "Android context is not available.", emptyException)
    } else if (GoogleApiAvailability.getInstance().isGooglePlayServicesAvailable(context!!) != ConnectionResult.SUCCESS) {
      return CodedException("ERR_INVALID_ENVIRONMENT", "Google Play Services is not available.", emptyException)
    } else if (credentialManager == null) {
      return CodedException("ERR_BAD_INPUT", "You must call configure() first.", emptyException)
    } else if (webClientId.isNullOrBlank()) {
      return CodedException("ERR_BAD_INPUT", "You must call configure() first and pass the webClientId.", emptyException)
    }

    return null
  }

  // Common login function that supports logging in with and without a button.
  // Documentation: https://developer.android.com/identity/sign-in/credential-manager-siwg
  private fun loginBase(loginType: LoginType, attemptNumber: Int, promise: Promise) {
    validateLoginDependencies()?.let {
      promise.reject(it)
      return
    }

    val credentialOption: CredentialOption = if (loginType == LoginType.WITH_BUTTON) {
      GetSignInWithGoogleOption.Builder(configureOptions?.webClientId!!)
        .setNonce(configureOptions?.nonce ?: "")
        .build()
    } else {
      val filterByAuthorizedAccounts = if (attemptNumber == 0) true else false
      GetGoogleIdOption.Builder()
        .setFilterByAuthorizedAccounts(filterByAuthorizedAccounts)
        .setServerClientId(configureOptions?.webClientId!!)
        .setAutoSelectEnabled(true)
        .setNonce(configureOptions?.nonce ?: "")
        .build()
    }

    val request: GetCredentialRequest = GetCredentialRequest.Builder()
      .addCredentialOption(credentialOption)
      .build()

    CoroutineScope(Dispatchers.Default).launch {
      try {
        val result = credentialManager!!.getCredential(
          request = request,
          context = context!!,
        )
        handleLogin(promise, result)
      } catch(e: GetCredentialCancellationException) {
        // As of (android.x.credentials:credentials-play-services-auth:1.2.2):
        // There is a bug in the Google Sign In SDK that causes
        // the GetCredentialCancellationException to be thrown for errors unrelated to cancel.
        // There is no way to distinguish between a real cancellation and a different error.
        //
        // In this case, switching to LoginType.WITHOUT_BUTTON may return more accurate error
        // messages.
        Log.i(TAG, "GetCredentialCancellationException.", e)
        handleLoginFailure(promise, "ERR_CANCELED", e)
      } catch (e: NoCredentialException) {
        if (attemptNumber == 0 && loginType == LoginType.WITHOUT_BUTTON) {
          Log.i(TAG, "NoCredentialException, retrying.", e)
          loginBase(loginType, 1, promise)
        } else {
          Log.e(TAG, "NoCredentialException, failing.", e)
          handleLoginFailure(promise, "ERR_NO_CRED", e)
        }
      } catch (e: GetCredentialException) {
        Log.e(TAG, "GetCredentialException.", e)
        handleLoginFailure(promise, "ERR_CRED", e)
      }
    }
  }

  private fun handleLogin(promise: Promise, result: GetCredentialResponse) {
    val credential: Credential = result.credential

    when (credential) {
      is CustomCredential -> {
        if (credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL) {
          try {
            val googleIdTokenCredential = GoogleIdTokenCredential
              .createFrom(credential.data)
            val profilePictureUri = modifyProfileImageParams(
              googleIdTokenCredential.profilePictureUri.toString()
            )
            val loginResult = mapOf(
              "displayName" to googleIdTokenCredential.displayName,
              "familyName" to googleIdTokenCredential.familyName,
              "givenName" to googleIdTokenCredential.givenName,
              "email" to googleIdTokenCredential.id,
              "id" to googleIdTokenCredential.id,
              "idToken" to googleIdTokenCredential.idToken,
              "phoneNumber" to googleIdTokenCredential.phoneNumber,
              "profilePictureUri" to profilePictureUri,
            )
            promise.resolve(loginResult)
          } catch (e: GoogleIdTokenParsingException) {
            handleLoginFailure(promise, "ERR_FAIL", e)
          }
        } else {
          Log.e(TAG, "Unexpected credential type.")
          handleLoginFailure(promise, "ERR_FAIL", Exception("Unexpected credential type."))
        }
      }

      else -> {
        // handle error
        Log.e(TAG, "Unexpected credential type.")
        handleLoginFailure(promise, "ERR_FAIL", Exception("Unexpected credential type."))
      }
    }
  }

  private fun modifyProfileImageParams(profilePictureUri: String?): String? {
    val profileImageSize: Int? = configureOptions?.profileImageSize ?: 120
    return profilePictureUri?.replace("s96-c", "s${configureOptions?.profileImageSize}")
  }

  private fun handleLoginFailure(promise: Promise, code: String, e: Exception) {
    val codedException = CodedException(code, e.message ?: "Unknown error", e);
    promise.reject(codedException)
  }

  private fun logout(promise: Promise) {
    CoroutineScope(Dispatchers.Default).launch {
      try {
        val credentialStateRequest = ClearCredentialStateRequest()
        credentialManager?.clearCredentialState(credentialStateRequest)
        promise.resolve()
      } catch (e: ClearCredentialException) {
        promise.reject(CodedException("ERR_LOGOUT_FAILED", e.message ?: "Unknown error", e))
      }
    }
  }
}
